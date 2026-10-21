package com.staystrong

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class StayStrongDeviceAdminReceiver : DeviceAdminReceiver() {

    private val TAG = "StayStrongDeviceAdmin"

    override fun onEnabled(context: Context, intent: Intent) {
        Log.d(TAG, "Device admin enabled")
        super.onEnabled(context, intent)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        Log.d(TAG, "Device admin disabled")
        super.onDisabled(context, intent)
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        Log.d(TAG, "Device admin: password changed")
        super.onPasswordChanged(context, intent)
    }
}
