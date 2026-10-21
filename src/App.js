import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@react-native-vector-icons/MaterialCommunityIcons';
import { NativeModules } from 'react-native';

const Tab = createBottomTabNavigator();
const { VPNModule, DeviceAdminModule } = NativeModules;

const MOTIVATIONAL = [
  "You're stronger than this. Prove it to yourself.",
  "Your brain is healing. Every day without it is a victory.",
  "Relapse is not failure. Getting back up is.",
  "You chose this. Stay with it.",
  "The urge passes. You are stronger than the urge.",
  "Your future self is grateful for what you're doing now.",
  "Pain is temporary. Pride is forever.",
  "This moment defines you. Choose wisely.",
  "You are not your addiction. You are your recovery.",
  "Thirty days. You've got this.",
  "Every time you say no, you get stronger.",
  "Healing is not linear. Persistence is.",
  "You deserve better than this.",
  "This is the hardest part. You're doing it.",
  "The light at the end is real. Keep walking.",
];

function DashboardScreen({ timerData, refreshing, onRefresh }) {
  const getRandomMotivation = () => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Stay Strong</Text>
        <Text style={styles.headerSubtitle}>Recovery Mode Active</Text>
      </View>

      {timerData ? (
        <>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>PROTECTION ENABLED</Text>
            <Text style={styles.timerText}>{timerData.daysRemaining}</Text>
            <Text style={styles.timerUnit}>days remaining</Text>
            <Text style={styles.timerSmall}>{timerData.hoursRemaining}h {timerData.minutesRemaining}m until unlock</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{timerData.blockedToday}</Text>
              <Text style={styles.statLabel}>Blocked Today</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{timerData.blockedTotal}</Text>
              <Text style={styles.statLabel}>Total Blocked</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{timerData.uniqueDomains}</Text>
              <Text style={styles.statLabel}>Unique Domains</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{timerData.streakDays}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
          </View>

          <View style={styles.motivationCard}>
            <MaterialCommunityIcons name="lightbulb" size={24} color="#667eea" />
            <Text style={styles.motivationText}>{getRandomMotivation()}</Text>
          </View>

          <View style={styles.vpnStatusCard}>
            <View style={styles.vpnStatus}>
              <View style={[styles.statusDot, timerData.vpnActive && styles.statusActive]} />
              <Text style={styles.vpnStatusText}>
                {timerData.vpnActive ? 'VPN Protection: ACTIVE' : 'VPN Protection: Starting...'}
              </Text>
            </View>
            <Text style={styles.vpnNote}>System-level blocking active. Cannot be bypassed.</Text>
          </View>

          <TouchableOpacity style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear History</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Initializing protection...</Text>
        </View>
      )}
    </ScrollView>
  );
}

function BlockedListScreen({ blocks }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Last Attempts Blocked</Text>
      </View>
      {blocks && blocks.length > 0 ? (
        blocks.slice(0, 100).map((block, idx) => (
          <View key={idx} style={styles.blockItem}>
            <View style={styles.blockContent}>
              <Text style={styles.blockDomain} numberOfLines={1}>
                {block.domain}
              </Text>
              <Text style={styles.blockReason}>{block.reason}</Text>
              <Text style={styles.blockTime}>{block.time}</Text>
            </View>
            <MaterialCommunityIcons name="block-helper" size={20} color="#e74c3c" />
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#27ae60" />
          <Text style={styles.emptyText}>No blocks recorded yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function SettingsScreen({ timerData, onRequestDeviceAdmin }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Protection Status</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>VPN Protection</Text>
            <Text style={styles.settingValue}>
              {timerData?.vpnActive ? 'ACTIVE' : 'PENDING'}
            </Text>
          </View>
          <View style={[styles.badge, timerData?.vpnActive && styles.badgeActive]}>
            <Text style={styles.badgeText}>{timerData?.vpnActive ? '✓' : '○'}</Text>
          </View>
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Device Admin</Text>
            <Text style={styles.settingValue}>
              {timerData?.adminActive ? 'ENABLED' : 'NOT ENABLED'}
            </Text>
          </View>
          <View style={[styles.badge, timerData?.adminActive && styles.badgeActive]}>
            <Text style={styles.badgeText}>{timerData?.adminActive ? '✓' : '○'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Lock Configuration</Text>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#3498db" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>30-Day Hard Lock</Text>
            <Text style={styles.infoText}>
              Timer started: {timerData?.startDate}
              {'\n\n'}
              Expires: {timerData?.expiryDate}
              {'\n\n'}
              You cannot stop this protection. The VPN service runs at the system level.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionButton} onPress={onRequestDeviceAdmin}>
          <MaterialCommunityIcons name="shield-account" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Enable Device Admin (Prevents Uninstall)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
        <Text style={styles.dangerText}>
          Attempting to bypass or disable protection during the 30-day period will trigger a 24-hour lockdown with all blocking intensified.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [timerData, setTimerData] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeApp();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    try {
      let startTime = await AsyncStorage.getItem('@staystrong_start_time');

      if (!startTime) {
        startTime = Date.now().toString();
        await AsyncStorage.setItem('@staystrong_start_time', startTime);
        
        if (Platform.OS === 'android' && VPNModule) {
          VPNModule.startVPNService();
        }
      }

      updateTimer();
      loadBlocks();
    } catch (e) {
      console.error(e);
    }
  };

  const updateTimer = async () => {
    try {
      const startTime = await AsyncStorage.getItem('@staystrong_start_time');
      if (!startTime) return;

      const start = parseInt(startTime);
      const now = Date.now();
      const elapsed = now - start;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const remaining = thirtyDays - elapsed;

      const daysRemaining = Math.max(0, Math.floor(remaining / (24 * 60 * 60 * 1000)));
      const hoursRemaining = Math.max(0, Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
      const minutesRemaining = Math.max(0, Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)));

      const startDate = new Date(start);
      const expiryDate = new Date(start + thirtyDays);

      const blockedData = await AsyncStorage.getItem('@staystrong_blocks');
      const allBlocks = blockedData ? JSON.parse(blockedData) : [];

      const today = new Date().toDateString();
      const blockedToday = allBlocks.filter(b => new Date(b.timestamp).toDateString() === today).length;

      setTimerData({
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
        blockedToday,
        blockedTotal: allBlocks.length,
        uniqueDomains: new Set(allBlocks.map(b => b.domain)).size,
        streakDays: daysRemaining < 30 ? 30 - daysRemaining : 0,
        startDate: startDate.toLocaleDateString(),
        expiryDate: expiryDate.toLocaleDateString(),
        vpnActive: remaining > 0,
        adminActive: true,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const loadBlocks = async () => {
    try {
      const blockedData = await AsyncStorage.getItem('@staystrong_blocks');
      setBlocks(blockedData ? JSON.parse(blockedData) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await updateTimer();
    await loadBlocks();
    setRefreshing(false);
  };

  const requestDeviceAdmin = () => {
    if (Platform.OS === 'android' && DeviceAdminModule) {
      DeviceAdminModule.requestDeviceAdmin();
    }
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = 'shield-home';
            else if (route.name === 'Blocked') iconName = 'block-helper';
            else if (route.name === 'Settings') iconName = 'cog';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#667eea',
          tabBarInactiveTintColor: '#bdc3c7',
          tabBarStyle: styles.tabBar,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          children={() => <DashboardScreen timerData={timerData} refreshing={refreshing} onRefresh={onRefresh} />}
        />
        <Tab.Screen
          name="Blocked"
          children={() => <BlockedListScreen blocks={blocks} />}
        />
        <Tab.Screen
          name="Settings"
          children={() => <SettingsScreen timerData={timerData} onRequestDeviceAdmin={requestDeviceAdmin} />}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 24, paddingTop: 40 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  timerCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  timerLabel: { fontSize: 12, fontWeight: '600', color: '#7f8c8d', letterSpacing: 1 },
  timerText: { fontSize: 48, fontWeight: 'bold', color: '#667eea', marginVertical: 8 },
  timerUnit: { fontSize: 16, color: '#34495e', fontWeight: '500' },
  timerSmall: { fontSize: 12, color: '#95a5a6', marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginTop: 16 },
  statBox: {
    width: '48%',
    marginRight: '4%',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#667eea' },
  statLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 4, textAlign: 'center' },
  motivationCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  motivationText: { fontSize: 14, color: '#2c3e50', marginLeft: 12, flex: 1, lineHeight: 20 },
  vpnStatusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  vpnStatus: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e74c3c', marginRight: 8 },
  statusActive: { backgroundColor: '#27ae60' },
  vpnStatusText: { fontSize: 14, fontWeight: '600', color: '#155724' },
  vpnNote: { fontSize: 12, color: '#155724', marginTop: 6, marginLeft: 20 },
  clearButton: { marginHorizontal: 16, marginTop: 20, marginBottom: 20, backgroundColor: '#e74c3c', padding: 12, borderRadius: 8, alignItems: 'center' },
  clearButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7f8c8d' },
  listHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  listHeaderText: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  blockItem: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  blockContent: { flex: 1 },
  blockDomain: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  blockReason: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  blockTime: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#7f8c8d', marginTop: 12 },
  settingsSection: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 12 },
  settingItem: { backgroundColor: '#fff', padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, elevation: 1 },
  settingLabel: { fontSize: 14, color: '#7f8c8d' },
  settingValue: { fontSize: 16, fontWeight: '600', color: '#667eea', marginTop: 4 },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ecf0f1', alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: '#d4edda' },
  badgeText: { fontSize: 18, fontWeight: 'bold', color: '#667eea' },
  infoBox: { backgroundColor: '#d1ecf1', padding: 12, borderRadius: 8, flexDirection: 'row', marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3498db' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#0c5460' },
  infoText: { fontSize: 12, color: '#0c5460', marginTop: 4, lineHeight: 18 },
  actionButton: { backgroundColor: '#667eea', padding: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 3 },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  dangerZone: { marginHorizontal: 16, marginTop: 20, marginBottom: 40, backgroundColor: '#fadbd8', padding: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
  dangerTitle: { fontSize: 14, fontWeight: 'bold', color: '#c0392b', marginBottom: 8 },
  dangerText: { fontSize: 12, color: '#a93226', lineHeight: 18 },
  tabBar: { backgroundColor: '#fff', borderTopColor: '#ecf0f1', elevation: 8 },
});
