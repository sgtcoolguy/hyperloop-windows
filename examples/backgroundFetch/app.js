"use hyperloop"

/*
 Create our simple UI.
 */
var window = Windows.UI.Xaml.Window.Current,
	text = new Windows.UI.Xaml.Controls.TextBlock();
text.Text = "Loading weather...";
text.TextAlignment =  Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment =  Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment =  Windows.UI.Xaml.HorizontalAlignment.Center;
text.FontSize = 60;
window.Content = text;
window.Activate();

/*
 Hit the REST API.
 */
var client = new Windows.Web.Http.HttpClient(),
	latitude = "37.389587", // Coordinates of
	longitude = "-122.05037", // Appcelerator HQ.
	api = 'http://api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longitude,
	uri = Hyperloop.method('Windows.Foundation.Uri', '.ctor(string)').call(api);

/*
 * Unlike C-API, create_task takes three arguments: create_task(task, then, error);
 */
create_task(client.GetStringAsync(uri), function handleThen(body) {
		console.log('Completed with:', body);
		var result = JSON.parse(body);
		console.log(result);
		var weather = 'The weather in\nMountain View:\n\n' + result.weather[0].description;
		console.log(weather);
		text.Text = weather;
	}, function handleError(err) {
		if (err) {
			text.Text = 'We hit an error when communicating with the server!\n\n' + err;
		}
});
