"use hyperloop"

var window = Windows.UI.Xaml.Window.Current,
	text = new Windows.UI.Xaml.Controls.TextBlock(),
	string = 'Hello, world!',
	buffer = Windows.Security.Cryptography.CryptographicBuffer.ConvertStringToBinary(string, Windows.Security.Cryptography.BinaryStringEncoding.Utf8);
	
text.FontSize = 60;
text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;

text.Text = 'Raw: ' + string;
text.Text += '\nBase64: ' + Windows.Security.Cryptography.CryptographicBuffer.EncodeToBase64String(buffer);
text.Text += '\nHex: ' + Windows.Security.Cryptography.CryptographicBuffer.EncodeToHexString(buffer);

window.Content = text;
window.Activate();