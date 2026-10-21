package com.staystrong

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootCompletedReceiver : BroadcastReceiver() {

    private val TAG = "BootCompletedReceiver"

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Device booted, checking if VPN should restart...")

            val prefs = context?.getSharedPreferences("staystrong_vpn", Context.MODE_PRIVATE)
            val startTime = prefs?.getLong("vpn_start_time", 0L) ?: 0L

            if (startTime > 0) {
                val thirtyDaysMs = 30L * 24 * 60 * 60 * 1000
                val expiryTime = startTime + thirtyDaysMs

                if (System.currentTimeMillis() < expiryTime) {
                    Log.d(TAG, "30-day period still active, restarting VPN...")
                    val vpnIntent = Intent(context, StayStrongVPNService::class.java)
                    vpnIntent.action = StayStrongVPNService.ACTION_START
                    context?.startService(vpnIntent)
                } else {
                    Log.d(TAG, "30-day period expired")
                }
            }
        }
    }
}
