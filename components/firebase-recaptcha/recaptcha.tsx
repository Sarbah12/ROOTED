import * as React from 'react';
import { WebView } from 'react-native-webview';

import type { FirebaseWebOptions } from './types';

/**
 * Hosts Firebase's reCAPTCHA widget inside a WebView so phone auth can run on
 * native. Firebase requires a reCAPTCHA token before it will send an SMS, and
 * reCAPTCHA is web-only — hence the WebView.
 *
 * Vendored from the abandoned `expo-firebase-recaptcha` package (MIT). The
 * original pulled its default config from `expo-firebase-core`, which carried
 * native code using the pre-SDK-44 unimodule format and no longer autolinks.
 * Here the config is a required prop instead, so no native dependency remains.
 */

/** Last release of the v8 namespaced SDK, which is what the page below uses. */
const DEFAULT_FIREBASE_VERSION = '8.10.1';

type Props = Omit<React.ComponentProps<typeof WebView>, 'source' | 'onError'> & {
  firebaseConfig: FirebaseWebOptions;
  firebaseVersion?: string;
  appVerificationDisabledForTesting?: boolean;
  languageCode?: string;
  onLoad?: () => void;
  onError?: () => void;
  onVerify: (token: string) => void;
  onFullChallenge?: () => void;
  invisible?: boolean;
  verify?: boolean;
};

function getWebviewSource(
  firebaseConfig: FirebaseWebOptions,
  firebaseVersion: string,
  appVerificationDisabledForTesting: boolean,
  languageCode?: string,
  invisible?: boolean
) {
  return {
    baseUrl: `https://${firebaseConfig.authDomain}`,
    html: `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="HandheldFriendly" content="true">
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js"></script>
  <script type="text/javascript">firebase.initializeApp(${JSON.stringify(firebaseConfig)});</script>
  <style>
    html, body {
      height: 100%;
      ${invisible ? `padding: 0; margin: 0;` : ``}
    }
    #recaptcha-btn {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      border: 0;
      user-select: none;
      -webkit-user-select: none;
    }
  </style>
</head>
<body>
  ${
    invisible
      ? `<button id="recaptcha-btn" type="button" onclick="onClickButton()">Confirm reCAPTCHA</button>`
      : `<div id="recaptcha-cont" class="g-recaptcha"></div>`
  }
  <script>
    var fullChallengeTimer;
    function onVerify(token) {
      if (fullChallengeTimer) {
        clearInterval(fullChallengeTimer);
        fullChallengeTimer = undefined;
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
    }
    function onLoad() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load' }));
      firebase.auth().settings.appVerificationDisabledForTesting = ${appVerificationDisabledForTesting};
      ${languageCode ? `firebase.auth().languageCode = '${languageCode}';` : ''}
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("${
        invisible ? 'recaptcha-btn' : 'recaptcha-cont'
      }", {
        size: "${invisible ? 'invisible' : 'normal'}",
        callback: onVerify
      });
      window.recaptchaVerifier.render();
    }
    function onError() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
    }
    // Firebase shows the full "pick the traffic lights" challenge in an iframe.
    // Watch for it so the host can swap the invisible widget for a visible modal.
    function onClickButton() {
      if (!fullChallengeTimer) {
        fullChallengeTimer = setInterval(function() {
          var iframes = document.getElementsByTagName("iframe");
          var isFullChallenge = false;
          for (var i = 0; i < iframes.length; i++) {
            var parentWindow = iframes[i].parentNode ? iframes[i].parentNode.parentNode : undefined;
            var isHidden = parentWindow && parentWindow.style.opacity == 0;
            isFullChallenge = isFullChallenge || (
              !isHidden &&
              ((iframes[i].title === 'recaptcha challenge') ||
               (iframes[i].src.indexOf('google.com/recaptcha/api2/bframe') >= 0)));
          }
          if (isFullChallenge) {
            clearInterval(fullChallengeTimer);
            fullChallengeTimer = undefined;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullChallenge' }));
          }
        }, 100);
      }
    }
    window.addEventListener('message', function(event) {
      if (event.data.verify) {
        document.getElementById('recaptcha-btn').click();
      }
    });
  </script>
  <script src="https://www.google.com/recaptcha/api.js?onload=onLoad&render=explicit&hl=${
    languageCode ?? ''
  }" onerror="onError()"></script>
</body></html>`,
  };
}

export default function FirebaseRecaptcha(props: Props) {
  const {
    firebaseConfig,
    firebaseVersion = DEFAULT_FIREBASE_VERSION,
    appVerificationDisabledForTesting = false,
    languageCode,
    onVerify,
    onLoad,
    onError,
    onFullChallenge,
    invisible,
    verify,
    ...otherProps
  } = props;

  const webview = React.useRef<WebView>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (webview.current && loaded && verify) {
      webview.current.injectJavaScript(`
        (function(){
          window.dispatchEvent(new MessageEvent('message', {data: { verify: true }}));
        })();
        true;
      `);
    }
  }, [verify, loaded]);

  if (!firebaseConfig?.authDomain) {
    console.error(
      'FirebaseRecaptcha: firebaseConfig is missing "authDomain"; phone sign-in cannot start.'
    );
    return null;
  }

  return (
    <WebView
      ref={webview}
      javaScriptEnabled
      automaticallyAdjustContentInsets
      scalesPageToFit
      mixedContentMode="always"
      source={getWebviewSource(
        firebaseConfig,
        firebaseVersion,
        appVerificationDisabledForTesting,
        languageCode,
        invisible
      )}
      onError={onError}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'load':
            setLoaded(true);
            onLoad?.();
            break;
          case 'error':
            onError?.();
            break;
          case 'verify':
            onVerify(data.token);
            break;
          case 'fullChallenge':
            onFullChallenge?.();
            break;
        }
      }}
      {...otherProps}
    />
  );
}
