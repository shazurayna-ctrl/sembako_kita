// ============================================
// MAIN.RS — SembakoKita.Pro v2026.07.01
// ============================================
// Tugas:
// 1. Entry point aplikasi Tauri
// 2. Register semua command (fungsi yang dipanggil dari JS)
// 3. Setup state & event handlers
// 4. Optimasi performa & keamanan
// ============================================

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    Manager, Window, AppHandle, State, 
    api::notification::Notification,
    api::dialog::{FileDialogBuilder, MessageDialogBuilder, MessageDialogKind},
    api::path::{BaseDirectory, app_dir, app_data_dir, app_cache_dir},
    api::fs::{read_file, write_file, read_dir, create_dir, remove_file, FileEntry},
    api::os::platform::current_exe,
    api::process::{Command, CommandEvent},
    async_runtime::spawn,
    SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent,
    CustomMenuItem, Menu, MenuItem, Submenu, AboutMetadata,
    generate_context,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Mutex;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::fs;
use chrono::{DateTime, Utc, Local};
use uuid::Uuid;
use log::{info, warn, error, debug, LevelFilter};
use sha2::{Sha256, Digest};
use aes_gcm::{Aes256Gcm, Key, Nonce, aead::Aead};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

// ============================================
// APP STATE
// ============================================
pub struct AppState {
    mesh_active: Mutex<bool>,
    sync_status: Mutex<String>,
    app_version: Mutex<String>,
    device_id: Mutex<String>,
    start_time: Mutex<u64>,
}

impl AppState {
    fn new() -> Self {
        Self {
            mesh_active: Mutex::new(true),
            sync_status: Mutex::new("idle".to_string()),
            app_version: Mutex::new(env!("CARGO_PKG_VERSION").to_string()),
            device_id: Mutex::new(Uuid::new_v4().to_string()),
            start_time: Mutex::new(SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
        }
    }
}

// ============================================
// COMMAND: GREET
// ============================================
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Halo, {}! Selamat datang di SembakoKita.Pro", name)
}

// ============================================
// COMMAND: GET_APP_VERSION
// ============================================
#[tauri::command]
fn get_app_version(state: State<AppState>) -> String {
    let version = state.app_version.lock().unwrap();
    version.clone()
}

// ============================================
// COMMAND: GET_DEVICE_ID
// ============================================
#[tauri::command]
fn get_device_id(state: State<AppState>) -> String {
    let id = state.device_id.lock().unwrap();
    id.clone()
}

// ============================================
// COMMAND: GET_UPTIME
// ============================================
#[tauri::command]
fn get_uptime(state: State<AppState>) -> u64 {
    let start = state.start_time.lock().unwrap();
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    now - *start
}

// ============================================
// COMMAND: SHOW_NOTIFICATION
// ============================================
#[tauri::command]
fn show_notification(app: AppHandle, title: String, body: String, icon: Option<String>) -> Result<(), String> {
    let mut notification = Notification::new(&app.config().tauri.bundle.identifier)
        .title(title)
        .body(body);
    
    if let Some(icon_path) = icon {
        if let Ok(icon) = tauri::api::assets::Asset::from_path(icon_path) {
            notification = notification.icon(icon);
        }
    }
    
    notification.show().map_err(|e| e.to_string())?;
    Ok(())
}

// ============================================
// COMMAND: SHOW_DIALOG
// ============================================
#[tauri::command]
fn show_dialog(title: String, message: String, kind: Option<String>) -> Result<(), String> {
    let dialog_kind = match kind.as_deref() {
        Some("info") => MessageDialogKind::Info,
        Some("warning") => MessageDialogKind::Warning,
        Some("error") => MessageDialogKind::Error,
        _ => MessageDialogKind::Info,
    };
    
    MessageDialogBuilder::new()
        .title(&title)
        .message(&message)
        .kind(dialog_kind)
        .show();
    
    Ok(())
}

// ============================================
// COMMAND: HASH_STRING (SHA-256)
// ============================================
#[tauri::command]
fn hash_string(input: String) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}

// ============================================
// COMMAND: ENCRYPT_DATA (AES-256-GCM)
// ============================================
#[tauri::command]
fn encrypt_data(data: String, password: String) -> Result<String, String> {
    use aes_gcm::aead::Aead;
    
    // Derive key from password (simplified - use proper KDF in production)
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let key_bytes = hasher.finalize();
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes[..32]);
    
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(b"unique nonce"); // In production, use random nonce
    
    let ciphertext = cipher.encrypt(nonce, data.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    Ok(BASE64.encode(ciphertext))
}

// ============================================
// COMMAND: DECRYPT_DATA (AES-256-GCM)
// ============================================
#[tauri::command]
fn decrypt_data(encrypted: String, password: String) -> Result<String, String> {
    use aes_gcm::aead::Aead;
    
    let ciphertext = BASE64.decode(encrypted)
        .map_err(|e| format!("Invalid base64: {}", e))?;
    
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let key_bytes = hasher.finalize();
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes[..32]);
    
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(b"unique nonce"); // Must match encryption
    
    let plaintext = cipher.decrypt(nonce, ciphertext.as_slice())
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {}", e))
}

// ============================================
// COMMAND: GET_MESH_STATUS
// ============================================
#[tauri::command]
fn get_mesh_status(state: State<AppState>) -> String {
    let status = state.mesh_active.lock().unwrap();
    if *status {
        "active".to_string()
    } else {
        "inactive".to_string()
    }
}

// ============================================
// COMMAND: TOGGLE_MESH
// ============================================
#[tauri::command]
fn toggle_mesh(state: State<AppState>) -> bool {
    let mut active = state.mesh_active.lock().unwrap();
    *active = !*active;
    *active
}

// ============================================
// COMMAND: GET_SYNC_STATUS
// ============================================
#[tauri::command]
fn get_sync_status(state: State<AppState>) -> String {
    let status = state.sync_status.lock().unwrap();
    status.clone()
}

// ============================================
// COMMAND: TRIGGER_SYNC
// ============================================
#[tauri::command]
fn trigger_sync(state: State<AppState>, app: AppHandle) -> Result<String, String> {
    let mut status = state.sync_status.lock().unwrap();
    *status = "syncing".to_string();
    
    // Simulasi sync di background
    let app_handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(3));
        // Notify via event
        app_handle.emit_all("sync-complete", json!({ "status": "success", "timestamp": Utc::now().to_rfc3339() })).unwrap_or_default();
    });
    
    Ok("Sync started".to_string())
}

// ============================================
// COMMAND: READ_FILE
// ============================================
#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(content)
}

// ============================================
// COMMAND: WRITE_FILE
// ============================================
#[tauri::command]
fn write_file_content(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

// ============================================
// COMMAND: GET_APP_DATA_DIR
// ============================================
#[tauri::command]
fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    let path = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    Ok(path.to_string_lossy().to_string())
}

// ============================================
// COMMAND: SCAN_BLUETOOTH
// ============================================
#[tauri::command]
fn scan_bluetooth() -> Result<Vec<String>, String> {
    // Simulasi scan BLE
    // Dalam produksi, integrasi dengan bluetooth crate
    let devices = vec![
        "Device-001 (Samsung A14)".to_string(),
        "Device-002 (Xiaomi Redmi 9)".to_string(),
        "Device-003 (OPPO A5s)".to_string(),
    ];
    Ok(devices)
}

// ============================================
// COMMAND: GET_BATTERY_STATUS
// ============================================
#[tauri::command]
fn get_battery_status() -> Result<Value, String> {
    // Simulasi baterai (di Tauri sebenarnya bisa pake plugin)
    Ok(json!({
        "level": 87,
        "charging": false,
        "status": "good"
    }))
}

// ============================================
// EVENT HANDLER: WINDOW READY
// ============================================
fn handle_window_ready(window: Window) {
    info!("🪟 Window ready: {}", window.label());
}

// ============================================
// EVENT HANDLER: WINDOW CLOSE
// ============================================
fn handle_window_close(window: Window) {
    info!("🚪 Window closed: {}", window.label());
}

// ============================================
// SETUP FUNCTION
// ============================================
fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let window = app.get_window("main").unwrap();
    window.set_title("SembakoKita.Pro").unwrap();
    
    info!("🚀 SembakoKita.Pro v{} started!", env!("CARGO_PKG_VERSION"));
    info!("📱 Device ID: {}", app.state::<AppState>().device_id.lock().unwrap());
    
    Ok(())
}

// ============================================
// MAIN
// ============================================
fn main() {
    // Inisialisasi logger
    env_logger::Builder::new()
        .filter_level(LevelFilter::Info)
        .format_timestamp_millis()
        .init();
    
    info!("🚀 Starting SembakoKita.Pro...");
    
    // Build menu
    let about_menu = AboutMetadata::new()
        .name(Some("SembakoKita.Pro"))
        .version(Some(env!("CARGO_PKG_VERSION")))
        .authors(Some(vec!["SembakoKita.Pro Team".to_string()]))
        .license(Some("MIT"))
        .website(Some("https://sembakokita.pro"))
        .website_label(Some("SembakoKita.Pro"));
    
    let menu = Menu::new()
        .add_item(CustomMenuItem::new("hide".to_string(), "Sembunyikan").into())
        .add_item(CustomMenuItem::new("quit".to_string(), "Keluar").into())
        .add_submenu(Submenu::new(
            "Tentang",
            Menu::new()
                .add_item(CustomMenuItem::about("about".to_string(), "Tentang SembakoKita.Pro", about_menu).into())
        ));
    
    // Tray menu
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Tampilkan"))
        .add_item(CustomMenuItem::new("quit".to_string(), "Keluar"));
    
    let tray = SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("SembakoKita.Pro");
    
    tauri::Builder::default()
        .setup(setup_app)
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            get_device_id,
            get_uptime,
            show_notification,
            show_dialog,
            hash_string,
            encrypt_data,
            decrypt_data,
            get_mesh_status,
            toggle_mesh,
            get_sync_status,
            trigger_sync,
            read_file_content,
            write_file_content,
            get_app_data_dir,
            scan_bluetooth,
            get_battery_status,
        ])
        .system_tray(tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    if window.is_visible().unwrap_or(false) {
                        window.hide().unwrap();
                    } else {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::Ready => {
                handle_window_ready(event.window().clone());
            }
            tauri::WindowEvent::CloseRequested { api, .. } => {
                handle_window_close(event.window().clone());
                api.prevent_close();
                event.window().hide().unwrap();
            }
            _ => {}
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}
