package com.staystrong

import android.app.Service
import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.Handler
import android.os.Looper
import android.util.Log
import kotlinx.coroutines.*
import java.io.*
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class StayStrongVPNService : VpnService() {

    private val TAG = "StayStrongVPN"
    private var vpnThread: Thread? = null
    private var isRunning = false
    private lateinit var prefs: SharedPreferences
    private val scope = CoroutineScope(Dispatchers.IO + Job())

    companion object {
        private const val CHANNEL_ID = "staystrong_vpn"
        private const val NOTIFICATION_ID = 1
        const val ACTION_START = "com.staystrong.VPN_START"
        const val ACTION_STOP = "com.staystrong.VPN_STOP"
    }

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("staystrong_vpn", MODE_PRIVATE)
        Log.d(TAG, "VPN Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand: ${intent?.action}")

        when (intent?.action) {
            ACTION_START -> startVPN()
            ACTION_STOP -> stopVPN()
            else -> startVPN()
        }

        return START_STICKY
    }

    private fun startVPN() {
        if (isRunning) return

        val startTime = prefs.getLong("vpn_start_time", System.currentTimeMillis())
        prefs.edit().putLong("vpn_start_time", startTime).apply()

        val thirtyDaysMs = 30L * 24 * 60 * 60 * 1000
        val expiryTime = startTime + thirtyDaysMs

        if (System.currentTimeMillis() > expiryTime) {
            Log.d(TAG, "30-day period expired, stopping VPN")
            stopVPN()
            return
        }

        isRunning = true
        vpnThread = Thread { runVPN() }
        vpnThread?.start()

        // Schedule re-check after 30 days
        Handler(Looper.getMainLooper()).postDelayed({
            if (System.currentTimeMillis() > expiryTime) {
                stopVPN()
            }
        }, expiryTime - System.currentTimeMillis())
    }

    private fun runVPN() {
        try {
            val builder = Builder()
            builder.setSession("StayStrong Protection")
            builder.addAddress("192.0.2.1", 24)
            builder.addRoute("0.0.0.0", 0)
            builder.addDnsServer("8.8.8.8")
            builder.addDnsServer("8.8.4.4")

            val vpnInterface = builder.establish() ?: run {
                Log.e(TAG, "Failed to establish VPN")
                return
            }

            Log.d(TAG, "VPN established")

            // Packet interception loop
            val inputStream = FileInputStream(vpnInterface.fileDescriptor)
            val outputStream = FileOutputStream(vpnInterface.fileDescriptor)
            val buffer = ByteArray(32767)

            while (isRunning) {
                val length = inputStream.read(buffer)
                if (length > 0) {
                    processPacket(buffer, length)
                    outputStream.write(buffer, 0, length)
                }
            }

            vpnInterface.close()
        } catch (e: Exception) {
            Log.e(TAG, "VPN error: ${e.message}")
        }
    }

    private fun processPacket(buffer: ByteArray, length: Int) {
        try {
            // Parse IP header (simplified DNS interception)
            if (length < 20) return

            val version = buffer[0].toInt() and 0xF0 shr 4
            if (version != 4) return

            val protocol = buffer[9].toInt() and 0xFF
            // 17 = UDP (DNS)
            if (protocol == 17) {
                // UDP packet - check for DNS (port 53)
                val destPort = ((buffer[22].toInt() and 0xFF) shl 8) or (buffer[23].toInt() and 0xFF)
                if (destPort == 53) {
                    val dnsQuery = extractDNSQuery(buffer, 28, length)
                    if (isDomainBlocked(dnsQuery)) {
                        Log.d(TAG, "Blocked DNS query: $dnsQuery")
                        // Don't respond - packet is dropped
                        return
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Packet processing error: ${e.message}")
        }
    }

    private fun extractDNSQuery(buffer: ByteArray, offset: Int, length: Int): String {
        return try {
            val query = StringBuilder()
            var i = offset + 12 // Skip DNS header

            while (i < length && i < offset + 100) {
                val len = buffer[i].toInt() and 0xFF
                if (len == 0) break

                if (query.isNotEmpty()) query.append(".")
                for (j in 1..len) {
                    if (i + j < length) {
                        query.append(buffer[i + j].toChar())
                    }
                }
                i += len + 1
            }
            query.toString()
        } catch (e: Exception) {
            ""
        }
    }

    private fun isDomainBlocked(domain: String): Boolean {
        val blockedDomains = listOf(
            "pornhub", "xvideos", "xnxx", "redtube", "youporn", "tube8",
            "spankbang", "tnaflix", "drtuber", "thumbzilla", "mofosex",
            "brazzers", "naughtyamerica", "realitykings", "bangbros", "digital"
        )

        val domainLower = domain.lowercase()
        return blockedDomains.any { domainLower.contains(it) }
    }

    private fun stopVPN() {
        isRunning = false
        vpnThread?.join(1000)
        stopSelf()
        Log.d(TAG, "VPN stopped")
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVPN()
        scope.cancel()
    }

    override fun onBind(intent: Intent?) = null
}
