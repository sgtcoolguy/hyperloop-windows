"use hyperloop"

var window = Windows.UI.Xaml.Window.Current,
	list = new Windows.UI.Xaml.Controls.ListView();

for (var i = 1; i <= 20; i++) {
	var text = new Windows.UI.Xaml.Controls.TextBlock();
	text.Text = 'Row '+i+'!';
	text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
	text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
	text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;
	text.FontSize = 60;
	list.Items.Append(text);
}

window.Content = list;
window.Activate();
