package com.onsightmartin.ticklelist;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Always start from Capacitor's configured community URL instead of
        // restoring a marketing page that previously replaced the WebView.
        super.onCreate(null);
    }
}
