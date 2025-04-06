import 'package:price_comparator_app/models/saved_item.dart';

// In-memory implementation for quick testing
class StorageService {
  static final Map<String, SavedItem> _items = {};

  // Get all saved items
  List<SavedItem> getSavedItems() {
    return _items.values.toList();
  }

  // Add a new saved item
  Future<void> addSavedItem(SavedItem item) async {
    final key = '${item.name}_${item.pincode}';
    _items[key] = item;
  }

  // Delete a saved item
  Future<void> deleteSavedItem(SavedItem item) async {
    final key = '${item.name}_${item.pincode}';
    _items.remove(key);
  }

  // Get a saved item by name and pincode
  SavedItem? getSavedItem(String name, String pincode) {
    final key = '${name}_$pincode';
    return _items[key];
  }

  // Check if an item exists
  bool hasSavedItem(String name, String pincode) {
    final key = '${name}_$pincode';
    return _items.containsKey(key);
  }

  // Clear all saved items
  Future<void> clearAllSavedItems() async {
    _items.clear();
  }
} 