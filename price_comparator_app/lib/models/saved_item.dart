// Simplified SavedItem model without Hive dependencies
class SavedItem {
  final String name;
  final String pincode;
  final DateTime addedAt;

  SavedItem({
    required this.name,
    required this.pincode,
    DateTime? addedAt,
  }) : addedAt = addedAt ?? DateTime.now();

  factory SavedItem.fromJson(Map<String, dynamic> json) {
    return SavedItem(
      name: json['name'] as String,
      pincode: json['pincode'] as String,
      addedAt: json['addedAt'] != null 
        ? DateTime.parse(json['addedAt'] as String) 
        : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'pincode': pincode,
      'addedAt': addedAt.toIso8601String(),
    };
  }
} 