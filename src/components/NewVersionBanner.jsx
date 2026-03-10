import { useEffect, useState } from 'react';
import {
  APP_VERSION,
  APP_VERSION_ENDPOINT,
  APP_VERSION_CHECK_INTERVAL_MS,
} from '@/lib/appVersion';
import { Button } from '@/components/ui/button';

export default function NewVersionBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkForNewVersion = async () => {
      try {
        const cacheBust = `t=${Date.now()}`;
        const url = `${APP_VERSION_ENDPOINT}?${cacheBust}`;
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache',
            pragma: 'no-cache',
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const deployedVersion = data?.version;

        if (!deployedVersion) {
          return;
        }

        if (deployedVersion !== APP_VERSION && isMounted) {
          setShowBanner(true);
        }
      } catch {
        // Keep this silent: version checks should never interrupt normal app usage.
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForNewVersion();
      }
    };

    checkForNewVersion();

    const intervalId = window.setInterval(checkForNewVersion, APP_VERSION_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="sticky top-0 z-[70] border-b border-amber-200 bg-amber-50 px-4 py-2 shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-amber-900">A new version of the app is available.</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
            className="h-8 bg-amber-500 px-3 text-xs font-semibold text-white hover:bg-amber-600"
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBanner(false)}
            className="h-8 px-2 text-xs text-amber-900 hover:bg-amber-100"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
