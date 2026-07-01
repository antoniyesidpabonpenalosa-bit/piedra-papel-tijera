class BusinessConfig {
  final String businessId;
  final String deviceName;
  final String masterCode;

  BusinessConfig({
    required this.businessId,
    required this.deviceName,
    required this.masterCode,
  });

  Map<String, dynamic> toMap() {
    return {
      'businessId': businessId,
      'deviceName': deviceName,
      'masterCode': masterCode,
    };
  }

  factory BusinessConfig.fromMap(Map<String, dynamic> map) {
    return BusinessConfig(
      businessId: map['businessId'] ?? '',
      deviceName: map['deviceName'] ?? '',
      masterCode: map['masterCode'] ?? '',
    );
  }
}
