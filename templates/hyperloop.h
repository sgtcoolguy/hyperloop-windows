/**
 * Windows
 */

#ifndef __HYPERLOOPWIN__HEADER__
#define __HYPERLOOPWIN__HEADER__

#include <inspectable.h>

typedef Hyperloop::NativeObject<Platform::Object^> * NativeWindowsObject;

template<class T>
void Hyperloop::NativeObject<T>::release()
{

}

template<class T>
void Hyperloop::NativeObject<T>::retain()
{

}

template<class T>
bool Hyperloop::NativeObject<T>::hasInstance(JSContextRef ctx, JSValueRef other, JSValueRef* exception)
{
	return false;
}

template<class T>
std::string Hyperloop::NativeObject<T>::toString(JSContextRef ctx, JSValueRef* exception)
{
	return nullptr;
}

template<class T>
double Hyperloop::NativeObject<T>::toNumber(JSContextRef ctx, JSValueRef* exception)
{
	return 0;
}

template<class T>
bool Hyperloop::NativeObject<T>::toBoolean(JSContextRef ctx, JSValueRef* exception)
{
	return false;
}

IInspectable* HyperloopWindowsObjectToPointer(Platform::Object^ o);

#endif
 
