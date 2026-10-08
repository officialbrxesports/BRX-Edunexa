export interface DeviceInfo {
  deviceType: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string | null;
  userAgent: string | null;
}

// ============================================================
// Header helper
// ============================================================

function getHeaderValue(
  value: string | string[] | undefined,
): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

// ============================================================
// Device parser
// ============================================================

export function parseDevice(
  userAgent?: string,
): Omit<DeviceInfo, 'ipAddress'> {
  const normalizedUserAgent =
    userAgent?.toLowerCase() ?? '';

  // ==========================================================
  // Device type
  // ==========================================================

  let deviceType = 'Desktop';

  if (
    /tablet|ipad|playbook|silk/i.test(
      normalizedUserAgent,
    )
  ) {
    deviceType = 'Tablet';
  } else if (
    /mobile|iphone|ipod|android/i.test(
      normalizedUserAgent,
    )
  ) {
    deviceType = 'Mobile';
  }

  // ==========================================================
  // Operating system
  // ==========================================================

  let operatingSystem = 'Unknown OS';

  if (/windows/i.test(normalizedUserAgent)) {
    operatingSystem = 'Windows';
  } else if (
    /mac os|macintosh/i.test(
      normalizedUserAgent,
    )
  ) {
    operatingSystem = 'macOS';
  } else if (/android/i.test(normalizedUserAgent)) {
    operatingSystem = 'Android';
  } else if (
    /iphone|ipad|ipod/i.test(
      normalizedUserAgent,
    )
  ) {
    operatingSystem = 'iOS';
  } else if (/linux/i.test(normalizedUserAgent)) {
    operatingSystem = 'Linux';
  }

  // ==========================================================
  // Browser
  // ==========================================================

  let browser = 'Unknown Browser';

  if (/edg\//i.test(normalizedUserAgent)) {
    browser = 'Microsoft Edge';
  } else if (/opr\//i.test(normalizedUserAgent)) {
    browser = 'Opera';
  } else if (
    /chrome\//i.test(normalizedUserAgent) &&
    !/edg\//i.test(normalizedUserAgent)
  ) {
    browser = 'Google Chrome';
  } else if (/firefox\//i.test(normalizedUserAgent)) {
    browser = 'Mozilla Firefox';
  } else if (
    /safari\//i.test(normalizedUserAgent) &&
    !/chrome\//i.test(normalizedUserAgent)
  ) {
    browser = 'Safari';
  }

  // ==========================================================
  // Device name
  // ==========================================================

  let deviceName = deviceType;

  if (deviceType === 'Mobile') {
    if (/iphone/i.test(normalizedUserAgent)) {
      deviceName = 'iPhone';
    } else if (
      /android/i.test(normalizedUserAgent)
    ) {
      deviceName = 'Android Phone';
    }
  }

  if (deviceType === 'Tablet') {
    if (/ipad/i.test(normalizedUserAgent)) {
      deviceName = 'iPad';
    } else if (
      /android/i.test(normalizedUserAgent)
    ) {
      deviceName = 'Android Tablet';
    }
  }

  if (deviceType === 'Desktop') {
    if (/windows/i.test(normalizedUserAgent)) {
      deviceName = 'Windows PC';
    } else if (
      /macintosh|mac os/i.test(
        normalizedUserAgent,
      )
    ) {
      deviceName = 'Mac';
    } else if (/linux/i.test(normalizedUserAgent)) {
      deviceName = 'Linux PC';
    }
  }

  return {
    deviceType,
    deviceName,
    browser,
    operatingSystem,
    userAgent: userAgent ?? null,
  };
}

// ============================================================
// Full request parser
// ============================================================

export function parseDeviceInfo(
  request: {
    headers: Record<
      string,
      string | string[] | undefined
    >;
    ip?: string;
  },
): DeviceInfo {
  const userAgent = getHeaderValue(
    request.headers['user-agent'],
  );

  const device = parseDevice(userAgent ?? undefined);

  // ==========================================================
  // IP address
  // ==========================================================

  const forwardedFor = getHeaderValue(
    request.headers['x-forwarded-for'],
  );

  const realIp = getHeaderValue(
    request.headers['x-real-ip'],
  );

  const ipAddress =
    forwardedFor
      ?.split(',')[0]
      ?.trim() ||
    realIp ||
    request.ip ||
    null;

  return {
    ...device,
    ipAddress,
  };
}