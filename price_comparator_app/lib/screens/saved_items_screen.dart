import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:price_comparator_app/models/saved_item.dart';
import 'package:price_comparator_app/providers/providers.dart';
import 'package:price_comparator_app/screens/results_screen.dart';

class SavedItemsScreen extends ConsumerWidget {
  const SavedItemsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedItems = ref.watch(savedItemsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Searches'),
        actions: [
          if (savedItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep),
              onPressed: () {
                _showClearAllDialog(context, ref);
              },
              tooltip: 'Clear All',
            ),
        ],
      ),
      body: savedItems.isEmpty
          ? _buildEmptyState(context)
          : _buildSavedItemsList(context, ref, savedItems),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark_border,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No Saved Searches',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Save your frequent searches for quick access',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
              },
              icon: const Icon(Icons.search),
              label: const Text('Start a Search'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedItemsList(
    BuildContext context,
    WidgetRef ref,
    List<SavedItem> items,
  ) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final item = items[index];
        return _buildSavedItemTile(context, ref, item);
      },
    );
  }

  Widget _buildSavedItemTile(
    BuildContext context,
    WidgetRef ref,
    SavedItem item,
  ) {
    final formattedDate = DateFormat.yMMMd().format(item.addedAt);

    return Dismissible(
      key: Key('${item.name}_${item.pincode}'),
      background: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        child: const Icon(
          Icons.delete,
          color: Colors.white,
        ),
      ),
      direction: DismissDirection.endToStart,
      onDismissed: (direction) {
        ref.read(savedItemsProvider.notifier).removeSavedItem(item);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${item.name} removed from saved searches'),
            action: SnackBarAction(
              label: 'UNDO',
              onPressed: () {
                ref.read(savedItemsProvider.notifier).addSavedItem(
                      item.name,
                      item.pincode,
                    );
              },
            ),
          ),
        );
      },
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 8,
        ),
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.white,
          child: const Icon(Icons.shopping_cart),
        ),
        title: Text(
          item.name,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(
                  Icons.location_on,
                  size: 16,
                  color: Colors.grey,
                ),
                const SizedBox(width: 4),
                Text(
                  'Pincode: ${item.pincode}',
                  style: TextStyle(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: Colors.grey,
                ),
                const SizedBox(width: 4),
                Text(
                  'Saved on: $formattedDate',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, size: 16),
          onPressed: () {
            _searchSavedItem(context, ref, item);
          },
        ),
        onTap: () {
          _searchSavedItem(context, ref, item);
        },
      ),
    );
  }

  void _searchSavedItem(BuildContext context, WidgetRef ref, SavedItem item) {
    // Set the search provider
    ref.read(searchProvider.notifier).state = {
      'item': item.name,
      'pincode': item.pincode,
    };

    // Navigate to results
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ResultsScreen(),
      ),
    );
  }

  void _showClearAllDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Saved Searches'),
        content: const Text(
          'Are you sure you want to remove all saved searches? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () {
              // Clear all saved items
              ref.read(storageServiceProvider).clearAllSavedItems();
              // Refresh the provider state
              ref.read(savedItemsProvider.notifier).loadSavedItems();
              Navigator.pop(context);
            },
            child: const Text(
              'CLEAR ALL',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
} 