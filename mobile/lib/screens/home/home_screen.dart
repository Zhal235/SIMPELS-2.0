import 'package:flutter/material.dart';
import 'package:simpels_mobile/screens/home/tabs/profile_tab.dart';
import 'package:simpels_mobile/screens/home/tabs/dashboard_tab.dart';
import 'package:simpels_mobile/screens/home/tabs/pembayaran_tab.dart';
import 'package:simpels_mobile/screens/home/tabs/riwayat_tab.dart';

class HomeScreen extends StatefulWidget {
  final int initialIndex;
  const HomeScreen({super.key, this.initialIndex = 0});

  // A global key is used by other screens to reliably access the HomeScreen state
  // (useful after hot-reload / hot-restart to ensure navigation targets the active instance)
  // Use a non-private generic type to avoid exposing private state in public API
  static final GlobalKey homeKey = GlobalKey();

  // Public helper so other widgets can request navigation without exposing
  // the private `_HomeScreenState` type in our public API.
  static void navigateToTab(int index) {
    final state = homeKey.currentState;
    if (state is _HomeScreenState) {
      state.navigateTo(index);
    }
  }

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    _screens = [
      DashboardTab(onNavigateToTab: (index) {
        // debug: show navigation attempts
        debugPrint('HomeScreen: request navigate to tab $index');
        if (!mounted) return;
        setState(() {
          _selectedIndex = index;
        });
        debugPrint('HomeScreen: selectedIndex now $_selectedIndex');
      }),
      const PembayaranTab(),
      const RiwayatTab(),
      const ProfileTab(),
    ];
  }

  // Public navigation method so child widgets can request tab changes
  void navigateTo(int index) {
    if (!mounted) return;
    setState(() {
      _selectedIndex = index;
    });
    debugPrint('HomeScreen.navigateTo: selectedIndex=$_selectedIndex');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(child: _screens[_selectedIndex]),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.payment),
            label: 'Pembayaran',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Riwayat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// Draft Pembayaran List Widget
