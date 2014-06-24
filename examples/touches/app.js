"use hyperloop"

var window = Windows.UI.Xaml.Window.Current;

var transformOrigin = new Windows.Foundation.Point();
transformOrigin.X = 0.5;
transformOrigin.Y = 0.5;

var cRed = Windows.UI.Colors.Red,
	cGreen = Windows.UI.Colors.Green,
	cBlue = Windows.UI.Colors.Blue,
	cYellow = Windows.UI.Colors.Yellow;

var canvas = new Windows.UI.Xaml.Controls.Canvas(),
	colors = {
		red: Hyperloop.method('Windows.UI.Xaml.Media.SolidColorBrush','.ctor(Windows.UI.Color)').call(cRed),
		green: Hyperloop.method('Windows.UI.Xaml.Media.SolidColorBrush','.ctor(Windows.UI.Color)').call(cGreen),
		blue: Hyperloop.method('Windows.UI.Xaml.Media.SolidColorBrush','.ctor(Windows.UI.Color)').call(cBlue),
		yellow: Hyperloop.method('Windows.UI.Xaml.Media.SolidColorBrush','.ctor(Windows.UI.Color)').call(cYellow)
	};

canvas.Background = colors.blue;
canvas.Width = window.Bounds.Width;
canvas.Height = window.Bounds.Height;

var seed = 1;
function random() {
	var x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}

for (var i = 0; i < 3; i++) {
	var view = new Windows.UI.Xaml.Controls.Canvas(),
		angle = { R: 0 },
		translation = { X: 0, Y: 0 };

	view.Width = (random() * 200 + 100) | 0;
	view.Height = (random() * 200 + 100) | 0;
	Windows.UI.Xaml.Controls.Canvas.SetTop(view, (random() * (canvas.Height - view.Height)) | 0);
	Windows.UI.Xaml.Controls.Canvas.SetLeft(view, (random() * (canvas.Width - view.Width)) | 0);

	view.ManipulationMode = Windows.UI.Xaml.Input.ManipulationModes.All;
	view.add_ManipulationDelta(function(object, _e) {
		try {
		var e = _e.cast('Windows.UI.Xaml.Input.ManipulationDeltaRoutedEventArgs'),
			source = e.OriginalSource,
			transformGroup = new Windows.UI.Xaml.Media.TransformGroup();
		source = source.cast('Windows.UI.Xaml.Controls.Canvas'); // TODO e.OriginalSource.cast('') doesn't work

		// Rotate.
		source.RenderTransformOrigin = transformOrigin;
		var rotateTransform = new Windows.UI.Xaml.Media.RotateTransform();
		rotateTransform.Angle = (angle.R += e.Delta.Rotation);
		transformGroup.Children.Append(rotateTransform);

		// Translate.
		var translateTransform = new Windows.UI.Xaml.Media.TranslateTransform();
		translateTransform.X = (translation.X += e.Delta.Translation.X);
		translateTransform.Y = (translation.Y += e.Delta.Translation.Y);
		transformGroup.Children.Append(translateTransform);

		console.log(JSON.stringify(translation));

		// Scale.
		source.Width += e.Delta.Expansion;
		source.Height += e.Delta.Expansion;

		// Apply.
		source.RenderTransform = transformGroup;
		} catch (E) {
			console.log(E);
		}
	});
	view.Background = colors[['red', 'yellow', 'green'][i % 3]];
	canvas.Children.Append(view);
}

window.Content = canvas;
window.Activate();