package com.archiekuo.frogcross;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * 青蛙過河 — 作者：ArchieKUO
 * 用 WebView 載入 assets/www/index.html（HTML5 Canvas 遊戲），全螢幕。
 * 畫面方向：橫式（預設）／直式／自動，由遊戲設定頁選擇，經 AndroidBridge.setOrientation 通知這裡並記住。
 */
public class MainActivity extends Activity {
    private WebView web;
    private static final String PREFS = "frogcross";

    /** 依設定值旋轉畫面：land 橫式、port 直式、auto 跟著手機（尊重系統的旋轉鎖定） */
    private void applyOrientation(String mode) {
        int o;
        if ("port".equals(mode)) o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
        else if ("auto".equals(mode)) o = ActivityInfo.SCREEN_ORIENTATION_USER;
        else o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        setRequestedOrientation(o);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        applyOrientation(getSharedPreferences(PREFS, MODE_PRIVATE).getString("orient", "land")); // 先轉好方向再載入畫面，避免閃一下
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0b1a12"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);               // localStorage：存檔用
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(v -> true);
        web.setHapticFeedbackEnabled(false);
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient());
        web.loadUrl("file:///android_asset/www/index.html");

        hideSystemUi();
    }

    private void hideSystemUi() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig); // 轉向時不重建 Activity，只重新隱藏系統列；遊戲自己會依視窗大小重排版面
        hideSystemUi();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    /** 返回鍵：先交給遊戲（暫停 / 回上一頁），遊戲沒處理才離開 */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(function(){return !!(window.onAndroidBack && window.onAndroidBack());})()", value -> {
            if (!"true".equals(value)) finish();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.evaluateJavascript("window.dispatchEvent(new Event('blur'))", null); // 讓遊戲自動暫停
        web.onPause();
        web.pauseTimers();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.resumeTimers();
        web.onResume();
        hideSystemUi();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    /** JS 端用 AndroidBridge.vibrate(ms) 震動、AndroidBridge.setOrientation(mode) 切換畫面方向 */
    private class Bridge {
        @JavascriptInterface
        public void setOrientation(final String mode) {
            final String m = ("port".equals(mode) || "auto".equals(mode)) ? mode : "land";
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("orient", m).apply();
            runOnUiThread(() -> applyOrientation(m));
        }

        @JavascriptInterface
        public void vibrate(int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null) return;
                if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                else v.vibrate(ms);
            } catch (Exception ignored) { }
        }
    }
}
