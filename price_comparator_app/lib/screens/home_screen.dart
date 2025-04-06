import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:price_comparator_app/models/saved_item.dart';
import 'package:price_comparator_app/providers/providers.dart';
import 'package:price_comparator_app/screens/results_screen.dart';
import 'package:price_comparator_app/screens/saved_items_screen.dart';
import 'package:intl/intl.dart';

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

  // Validate that pincode is 6 digits
  String? _validatePincode(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter a pincode';
    }
    if (value.length != 6) {
      return 'Pincode must be 6 digits';
    }
    if (!RegExp(r'^[0-9]+$').hasMatch(value)) {
      return 'Pincode must contain only digits';
    }
    return null;
  }

  // Validate that item name is not empty
  String? _validateItem(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter an item name';
    }
    return null;
  }

  // Replace the searchButton method with this improved version
  Widget _searchButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: () {
          // Check if form is valid
          if (_formKey.currentState!.validate()) {
            // Save the form
            _formKey.currentState!.save();

            // Set search parameters in the provider
            final itemName = _itemController.text.trim();
            final pincode = _pincodeController.text.trim();

            ref.read(searchProvider.notifier).state = {
              'item': itemName,
              'pincode': pincode,
            };

            // Navigate to results screen
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ResultsScreen(),
              ),
            );
          }
        },
        icon: const Icon(Icons.compare_arrows),
        label: const Text(
          'Compare Prices',
          style: TextStyle(fontSize: 16),
        ),
        style: ElevatedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
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
                          validator: _validateItem,
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
                          validator: _validatePincode,
                        ),
                        const SizedBox(height: 24),
                        _searchButton(context),
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
                      return _buildSavedItem(context, item);
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

  Widget _buildSavedItem(BuildContext context, SavedItem item) {
    // Get the date to display
    final displayDate = DateFormat('MMM d, yyyy').format(item.addedAt);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(item.name),
        subtitle: Row(
          children: [
            Icon(
              Icons.location_on,
              size: 14,
              color: Colors.grey[600],
            ),
            const SizedBox(width: 4),
            Text(
              item.pincode,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.access_time,
              size: 14,
              color: Colors.grey[600],
            ),
            const SizedBox(width: 4),
            Text(
              displayDate,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete),
          onPressed: () {
            ref.read(savedItemsProvider.notifier).removeSavedItem(item);
          },
        ),
        onTap: () {
          _itemController.text = item.name;
          _pincodeController.text = item.pincode;
          
          // Check if form is valid
          if (_formKey.currentState!.validate()) {
            // Set search parameters in the provider
            ref.read(searchProvider.notifier).state = {
              'item': item.name,
              'pincode': item.pincode,
            };

            // Navigate to results screen
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ResultsScreen(),
              ),
            );
          }
        },
      ),
    );
  }
} 