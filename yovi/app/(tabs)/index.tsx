import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <WebView
      source={{ uri: 'http://4.233.210.164' }}
      style={styles.webview}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});