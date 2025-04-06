import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:price_comparator_app/models/price_result.dart';
import 'package:price_comparator_app/models/saved_item.dart';
import 'package:price_comparator_app/services/api_service.dart';
import 'package:price_comparator_app/services/storage_service.dart';

// Provider for API Service
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

// Provider for Storage Service
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

// Provider for saved items
final savedItemsProvider = StateNotifierProvider<SavedItemsNotifier, List<SavedItem>>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return SavedItemsNotifier(storageService);
});

class SavedItemsNotifier extends StateNotifier<List<SavedItem>> {
  final StorageService _storageService;

  SavedItemsNotifier(this._storageService) : super([]) {
    // Load saved items when initialized
    loadSavedItems();
  }

  void loadSavedItems() {
    state = _storageService.getSavedItems();
  }

  Future<void> addSavedItem(String name, String pincode) async {
    final newItem = SavedItem(name: name, pincode: pincode);
    await _storageService.addSavedItem(newItem);
    loadSavedItems();
  }

  Future<void> removeSavedItem(SavedItem item) async {
    await _storageService.deleteSavedItem(item);
    loadSavedItems();
  }

  bool hasSavedItem(String name, String pincode) {
    return _storageService.hasSavedItem(name, pincode);
  }
}

// Provider for the current search
final searchProvider = StateProvider<Map<String, String>?>((ref) => null);

// Provider for price comparison results with built-in loading state
final priceResultsProvider = FutureProvider.autoDispose<PriceResponse>((ref) async {
  final search = ref.watch(searchProvider);
  if (search == null || search['item'] == null || search['pincode'] == null) {
    throw Exception('Please enter an item and pincode to search');
  }

  final apiService = ref.watch(apiServiceProvider);
  
  // No need to manually track loading state, AsyncValue handles it
  final results = await apiService.getPrices(
    search['item']!,
    search['pincode']!,
  );
  
  return results;
}); 