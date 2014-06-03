/**
 * Windows
 */

#include <iostream>
#include <string>
#include <inspectable.h>

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

