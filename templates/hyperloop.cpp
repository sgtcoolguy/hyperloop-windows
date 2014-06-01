/**
 * Windows
 */

#include <iostream>
#include <string>
#include <inspectable.h>

/*
 * Windows object specialization
 */

template <>
void Hyperloop::NativeObject<IInspectable*>::release()
{

}

template <>
void Hyperloop::NativeObject<IInspectable*>::retain()
{

}

template<>
bool Hyperloop::NativeObject<IInspectable*>::hasInstance(JSContextRef ctx, JSValueRef other, JSValueRef* exception)
{
	return false;
}

template<>
std::string Hyperloop::NativeObject<IInspectable*>::toString(JSContextRef ctx, JSValueRef* exception)
{
	return nullptr;
}

template<>
double Hyperloop::NativeObject<IInspectable*>::toNumber(JSContextRef ctx, JSValueRef* exception)
{
	return NAN;
}

template<>
bool Hyperloop::NativeObject<IInspectable*>::toBoolean(JSContextRef ctx, JSValueRef* exception)
{
	return false;
}

IInspectable* HyperloopWindowsObjectToPointer(Platform::Object^ o) {
	return reinterpret_cast<IInspectable*>(o);
}

/**
 * native implementation of the logger
 */
void HyperloopNativeLogger(const char *str)
{
    std::cout << str << std::endl;
}

