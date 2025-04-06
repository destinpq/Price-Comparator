import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:price_comparator_app/models/price_result.dart';

class ApiService {
  // Production endpoint on DigitalOcean
  static const String baseUrl = 'https://hammerhead-app-wafj8.ondigitalocean.app';
  
  final Dio _dio;

  ApiService()
      : _dio = Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
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
      final fullUrl = '$baseUrl/api/mock-prices';
      debugPrint('API URL: $fullUrl');

      final response = await _dio.get(
        fullUrl,
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
      throw Exception('Unexpected error: $e');
    }
  }

  // Post prices request to the API
  Future<PriceResponse> postPrices(String item, String pincode) async {
    try {
      debugPrint('Posting prices for $item in pincode $pincode');
      final fullUrl = '$baseUrl/api/mock-prices';
      
      final response = await _dio.post(
        fullUrl,
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
      // Detailed error logging for network issues
      debugPrint('====== DIO ERROR ======');
      debugPrint('URL: ${e.requestOptions.uri}');
      debugPrint('Type: ${e.type}');
      debugPrint('Error: ${e.error}');
      
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
      throw Exception('Unexpected error: $e');
    }
  }
} 