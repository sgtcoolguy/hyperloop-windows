/**
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This generated code and related technologies are covered by patents
 * or patents pending by Appcelerator, Inc.
 */

using namespace Platform;
using namespace Windows::UI::Xaml;
using namespace Windows::ApplicationModel::Activation;

#include <iostream>
#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>
#include <Windows.h>
#include "hyperloop.h"
#include "Logger.h"

EXPORTAPI void HyperloopAppRequire(JSValueRef *);

ref class HyperloopApp sealed : public Application
{
public:
	virtual void OnLaunched(LaunchActivatedEventArgs^ args) override;
	virtual void OnActivated(IActivatedEventArgs^ args) override;
private:
	void Boot();
	JSGlobalContextRef context;
	bool booted;
};
void HyperloopApp::OnLaunched(LaunchActivatedEventArgs^ args)
{
	Boot();
}
void HyperloopApp::OnActivated(IActivatedEventArgs^ args)
{
	if (args->Kind == Windows::ApplicationModel::Activation::ActivationKind::Protocol)
	{
		Boot();
	}
}
void HyperloopApp::Boot()
{
	if (booted) {
		return;
	}
	booted = true;
	
	JSValueRef exception = NULL;
	this->context = InitializeHyperloop();

	HyperloopAppRequire(&exception);

	if (exception!=nullptr)
	{
        JSStringRef str = JSValueToStringCopy(HyperloopGlobalContext(), exception, NULL);
        const size_t len = JSStringGetLength(str);
        char* buf = new char[len];
        JSStringGetUTF8CString(str, (char *)buf, len);
        JSStringRelease(str);

        Logger::log(HyperloopWindowsGetPlatformString(buf));

        delete[] buf;
	} else {
		Logger::log("Hyperloop App started");
	}
}

int main(Platform::Array<Platform::String ^> ^)
{
	Application::Start(ref new ApplicationInitializationCallback([](ApplicationInitializationCallbackParams ^params) {
		HyperloopApp^ app = ref new HyperloopApp();
	}));
	return 0;
}