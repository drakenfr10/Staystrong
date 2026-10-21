package com.staystrong

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VPNModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context = reactContext
    private val TAG = "VPNModule"

    override fun getName() = "VPNModule"

    @ReactMethod
    fun startVPNService() {
        try {
            val intent = Intent(context, StayStrongVPNService::class.java)
            intent.action = StayStrongVPNService.ACTION_START
            context.startService(intent)
            Log.d(TAG, "VPN service started")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN: ${e.message}")
        }
    }

    @ReactMethod
    fun stopVPNService() {
        try {
            val intent = Intent(context, StayStrongVPNService::class.java)
            intent.action = StayStrongVPNService.ACTION_STOP
            context.startService(intent)
            Log.d(TAG, "VPN service stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping VPN: ${e.message}")
        }
    }

    @ReactMethod
    fun isVPNActive(callback: com.facebook.react.bridge.Callback) {
        try {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val processes = am.runningAppProcesses
            val vpnActive = processes.any { it.processName.contains("staystrong") }
            callback.invoke(vpnActive)
        } catch (e: Exception) {
            callback.invoke(false)
        }
    }
}

class DeviceAdminModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context = reactContext
    private val TAG = "DeviceAdminModule"

    override fun getName() = "DeviceAdminModule"

    @ReactMethod
    fun requestDeviceAdmin() {
        try {
            val componentName = ComponentName(context, StayStrongDeviceAdminReceiver::class.java)
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, 
                "Enable Device Admin to prevent accidental uninstall during recovery.")
            context.startActivity(intent)
            Log.d(TAG, "Device admin request sent")
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting device admin: ${e.message}")
        }
    }

    @ReactMethod
    fun isDeviceAdminActive(callback: com.facebook.react.bridge.Callback) {
        try {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(context, StayStrongDeviceAdminReceiver::class.java)
            val isActive = dpm.isAdminActive(componentName)
            callback.invoke(isActive)
        } catch (e: Exception) {
            callback.invoke(false)
        }
    }

    @ReactMethod
    fun disableUninstall(enable: Boolean) {
        try {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val componentName = ComponentName(context, StayStrongDeviceAdminReceiver::class.java)
            
            if (dpm.isAdminActive(componentName)) {
                dpm.setCameraDisabled(componentName, enable)
                Log.d(TAG, "Uninstall protection set: $enable")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error setting uninstall protection: ${e.message}")
        }
    }
}
