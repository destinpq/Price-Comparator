import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:price_comparator_app/models/price_result.dart';

class ApiService {
  // Update to use the production endpoint
  static const String baseUrl = 'http://10.244.17.31:8080';
  // Other options:
  // - Android emulator: 'http://10.0.2.2:3000'
  // - iOS simulator: 'http://localhost:3000'
  // - Production: 'https://your-deployed-backend.com'
  
  final Dio _dio = Dio();  // Don't set baseUrl in BaseOptions

  // Get prices from the API using GET method
  Future<PriceResponse> getPrices(String item, String pincode) async {
    try {
      // Use the full URL instead of relying on baseUrl + path
      final response = await _dio.get(
        '$baseUrl/api/mock-prices',
        queryParameters: {
          'item': item,
          'pincode': pincode,
        },
        options: Options(
          sendTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          contentType: 'application/json',
        ),
      );

      if (response.statusCode == 200) {
        return PriceResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to load prices: ${response.statusCode}');
      }
    } on DioException catch (e) {
      throw Exception('Network error: ${e.message}\nURL: ${e.requestOptions.uri}');
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  // Post prices request to the API
  Future<PriceResponse> postPrices(String item, String pincode) async {
    try {
      final response = await _dio.post(
        '$baseUrl/api/mock-prices',
        data: jsonEncode({
          'item': item,
          'pincode': pincode,
        }),
        options: Options(
          sendTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          contentType: 'application/json',
        ),
      );

      if (response.statusCode == 200) {
        return PriceResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to load prices: ${response.statusCode}');
      }
    } on DioException catch (e) {
      throw Exception('Network error: ${e.message}\nURL: ${e.requestOptions.uri}');
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }
} 