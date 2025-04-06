class PriceResult {
  final String platform;
  final String? productTitle;
  final String? price;
  final bool available;
  final String? deliveryEta;
  final String? imageUrl;
  final String? error;

  PriceResult({
    required this.platform,
    this.productTitle,
    this.price,
    required this.available,
    this.deliveryEta,
    this.imageUrl,
    this.error,
  });

  factory PriceResult.fromJson(Map<String, dynamic> json) {
    return PriceResult(
      platform: json['platform'] as String,
      productTitle: json['productTitle'] as String?,
      price: json['price'] as String?,
      available: json['available'] as bool,
      deliveryEta: json['deliveryEta'] as String?,
      imageUrl: json['imageUrl'] as String?,
      error: json['error'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'platform': platform,
      'productTitle': productTitle,
      'price': price,
      'available': available,
      'deliveryEta': deliveryEta,
      'imageUrl': imageUrl,
      'error': error,
    };
  }
}

class PriceResponse {
  final List<PriceResult> results;
  final String timestamp;
  final String? item;
  final String? pincode;

  PriceResponse({
    required this.results,
    required this.timestamp,
    this.item,
    this.pincode,
  });

  factory PriceResponse.fromJson(Map<String, dynamic> json) {
    return PriceResponse(
      results: (json['results'] as List)
          .map((e) => PriceResult.fromJson(e as Map<String, dynamic>))
          .toList(),
      timestamp: json['timestamp'] as String,
      item: json['item'] as String?,
      pincode: json['pincode'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'results': results.map((e) => e.toJson()).toList(),
      'timestamp': timestamp,
      'item': item,
      'pincode': pincode,
    };
  }
} 