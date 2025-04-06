import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:price_comparator_app/models/saved_item.dart';
import 'package:price_comparator_app/providers/providers.dart';
import 'package:price_comparator_app/screens/results_screen.dart';
import 'package:price_comparator_app/screens/saved_items_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _itemController = TextEditingController();
  final _pincodeController = TextEditingController();

  @override
  void dispose() {
    _itemController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  void _search() {
    if (_formKey.currentState!.validate()) {
      // Set the search provider with current values
      ref.read(searchProvider.notifier).state = {
        'item': _itemController.text.trim(),
        'pincode': _pincodeController.text.trim(),
      };

      // Navigate to results screen
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => const ResultsScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Get saved items
    final savedItems = ref.watch(savedItemsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Grocery Price Comparator'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const SavedItemsScreen(),
                ),
              );
            },
            tooltip: 'Saved Items',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo and App Name
              Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.shopping_basket,
                      size: 80,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Find the Best Price',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Compare prices from Blinkit, Zepto, D-Mart & Instamart',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Search Form
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _itemController,
                          decoration: const InputDecoration(
                            labelText: 'Grocery Item',
                            hintText: 'e.g., Milk, Bread, Eggs',
                            prefixIcon: Icon(Icons.search),
                            border: OutlineInputBorder(),
                          ),
                          textCapitalization: TextCapitalization.words,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter a grocery item';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _pincodeController,
                          decoration: const InputDecoration(
                            labelText: 'Pincode',
                            hintText: 'e.g., 400001',
                            prefixIcon: Icon(Icons.location_on),
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter a pincode';
                            }
                            if (value.trim().length != 6 || int.tryParse(value.trim()) == null) {
                              return 'Please enter a valid 6-digit pincode';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _search,
                          icon: const Icon(Icons.compare_arrows),
                          label: const Text('COMPARE PRICES'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Theme.of(context).colorScheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            textStyle: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Recent Searches
              if (savedItems.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                  child: Text(
                    'Recent Searches',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: savedItems.length > 5 ? 5 : savedItems.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = savedItems[index];
                      return _buildSavedItemTile(item);
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSavedItemTile(SavedItem item) {
    return ListTile(
      leading: const CircleAvatar(
        child: Icon(Icons.shopping_cart),
      ),
      title: Text(item.name),
      subtitle: Text('Pincode: ${item.pincode}'),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: () {
        // Set controllers to saved values
        _itemController.text = item.name;
        _pincodeController.text = item.pincode;
        _search();
      },
    );
  }
} 