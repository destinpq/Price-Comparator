import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:price_comparator_app/models/price_result.dart';

class ApiService {
  // Production endpoint on DigitalOcean
  static const String productionUrl = 'https://hammerhead-app-wafj8.ondigitalocean.app';
  
  // Development endpoint on local network - update with your computer's IP
  static const String developmentUrl = 'http://192.168.0.100:3000';
  
  // Toggle this to switch between production and development
  static final bool useDevServer = false;  // Set to false to use production
  
  // Current base URL based on environment
  static String get baseUrl => useDevServer ? developmentUrl : productionUrl;
  
  final Dio _dio;

  ApiService()
      : _dio = Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 10), // Shorter timeout to handle fallbacks quicker
          receiveTimeout: const Duration(seconds: 10),
        )) {
    // Add logging interceptor for debug builds
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        request: true,
        requestHeader: true,
        requestBody: true,
        responseHeader: true,
        responseBody: true,
        error: true,
      ));
    }
  }

  // Get prices from the API using GET method
  Future<PriceResponse> getPrices(String item, String pincode) async {
    try {
      debugPrint('Fetching prices for $item in pincode $pincode');
      
      // For development, use the actual endpoint; for mock data use mock-prices
      final endpoint = useDevServer ? '/api/get-prices' : '/api/mock-prices';
      final fullUrl = '$baseUrl$endpoint';
      
      debugPrint('API URL: $fullUrl');

      final response = await _dio.get(
        fullUrl,
        queryParameters: {
          'item': item,
          'pincode': pincode,
        },
        options: Options(
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          contentType: 'application/json',
        ),
      );

      debugPrint('Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        debugPrint('Response data: ${response.data}');
        return PriceResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to load prices: ${response.statusCode}');
      }
    } on DioException catch (e) {
      // Detailed error logging for network issues
      debugPrint('====== DIO ERROR ======');
      debugPrint('URL: ${e.requestOptions.uri}');
      debugPrint('Type: ${e.type}');
      debugPrint('Error: ${e.error}');
      debugPrint('Message: ${e.message}');
      if (e.response != null) {
        debugPrint('Response Status: ${e.response?.statusCode}');
        debugPrint('Response Data: ${e.response?.data}');
      }
      
      // If using dev server and fails, try production as fallback
      if (useDevServer) {
        debugPrint('Dev server failed, trying production server as fallback...');
        try {
          final fallbackUrl = '$productionUrl/api/mock-prices';
          debugPrint('Fallback URL: $fallbackUrl');
          
          final response = await _dio.get(
            fallbackUrl,
            queryParameters: {
              'item': item,
              'pincode': pincode,
            },
            options: Options(
              sendTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
              contentType: 'application/json',
            ),
          );
          
          if (response.statusCode == 200) {
            debugPrint('Fallback successful, using production data');
            return PriceResponse.fromJson(response.data);
          }
        } catch (fallbackError) {
          debugPrint('Fallback also failed: $fallbackError');
          // Continue to throw the original error
        }
      }
      
      // If both fail or not using dev server, provide mock data
      if (kDebugMode) {
        debugPrint('Returning mock data for development');
        return _getMockResponse(item, pincode);
      }
      
      // Return user-friendly error based on error type
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          throw Exception('Connection timeout. Please check your internet connection and try again.');
        case DioExceptionType.connectionError:
          throw Exception('Cannot connect to server at $baseUrl. Please check your internet connection.');
        case DioExceptionType.badResponse:
          throw Exception('Server error: ${e.response?.statusCode}. Please try again later.');
        default:
          throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      debugPrint('Unexpected error: $e');
      
      // If in debug mode, return mock data instead of crashing
      if (kDebugMode) {
        debugPrint('Returning mock data for development');
        return _getMockResponse(item, pincode);
      }
      
      throw Exception('Unexpected error: $e');
    }
  }

  // Post prices request to the API
  Future<PriceResponse> postPrices(String item, String pincode) async {
    try {
      debugPrint('Posting prices for $item in pincode $pincode');
      
      // For development, use the actual endpoint; for mock data use mock-prices
      final endpoint = useDevServer ? '/api/get-prices' : '/api/mock-prices';
      final fullUrl = '$baseUrl$endpoint';
      
      final response = await _dio.post(
        fullUrl,
        data: jsonEncode({
          'item': item,
          'pincode': pincode,
        }),
        options: Options(
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          contentType: 'application/json',
        ),
      );

      if (response.statusCode == 200) {
        return PriceResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to load prices: ${response.statusCode}');
      }
    } on DioException catch (e) {
      // Detailed error logging for network issues
      debugPrint('====== DIO ERROR ======');
      debugPrint('URL: ${e.requestOptions.uri}');
      debugPrint('Type: ${e.type}');
      debugPrint('Error: ${e.error}');
      
      // If in debug mode, return mock data instead of crashing
      if (kDebugMode) {
        debugPrint('Returning mock data for development');
        return _getMockResponse(item, pincode);
      }
      
      // Return user-friendly error based on error type
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          throw Exception('Connection timeout. Please check your internet connection and try again.');
        case DioExceptionType.connectionError:
          throw Exception('Cannot connect to server at $baseUrl. Please check your internet connection.');
        case DioExceptionType.badResponse:
          throw Exception('Server error: ${e.response?.statusCode}. Please try again later.');
        default:
          throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      debugPrint('Unexpected error: $e');
      
      // If in debug mode, return mock data instead of crashing
      if (kDebugMode) {
        debugPrint('Returning mock data for development');
        return _getMockResponse(item, pincode);
      }
      
      throw Exception('Unexpected error: $e');
    }
  }
  
  // Helper method to provide mock data for development and testing
  PriceResponse _getMockResponse(String item, String pincode) {
    final now = DateTime.now();
    final timestamp = now.toIso8601String();
    
    return PriceResponse(
      results: [
        PriceResult(
          platform: 'Blinkit',
          productTitle: '$item (Mock)',
          price: '₹80',
          available: true,
          deliveryEta: '10 min',
          imageUrl: 'https://cdn.pixabay.com/photo/2016/12/06/18/27/milk-1887234_1280.jpg',
        ),
        PriceResult(
          platform: 'Zepto',
          productTitle: '$item (Mock)',
          price: '₹85',
          available: true,
          deliveryEta: '8 min',
          imageUrl: 'https://cdn.pixabay.com/photo/2016/12/06/18/27/milk-1887234_1280.jpg',
        ),
        PriceResult(
          platform: 'BigBasket',
          productTitle: '$item (Mock)',
          price: '₹75',
          available: true,
          deliveryEta: '2 hours',
          imageUrl: 'https://cdn.pixabay.com/photo/2016/12/06/18/27/milk-1887234_1280.jpg',
        ),
        PriceResult(
          platform: 'JioMart',
          productTitle: '$item (Mock)',
          price: '₹78',
          available: true,
          deliveryEta: '1 day',
          imageUrl: 'https://cdn.pixabay.com/photo/2016/12/06/18/27/milk-1887234_1280.jpg',
        ),
      ],
      timestamp: timestamp,
      item: item,
      pincode: pincode,
    );
  }
} 