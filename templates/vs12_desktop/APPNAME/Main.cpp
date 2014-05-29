#include <Windows.h>

using namespace Windows::UI::Xaml;

ref class App sealed : public ::Application
{
};

int main(Platform::Array<Platform::String ^> ^)
{
	Application::Start(ref new ApplicationInitializationCallback([](ApplicationInitializationCallbackParams ^params) {
		App ^app = ref new App();
	}));
	return 0;
}