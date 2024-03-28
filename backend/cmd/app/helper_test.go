package main

import "testing"

func TestGetFunctionNameToReturnCorrectFunctionName(t *testing.T) {
	expectedName := "TestGetFunctionNameToReturnCorrectFunctionName"
	name := GetFunctionName()
	if name != expectedName {
		t.Errorf("Expected function name to be %s, got %s", expectedName, name)
	}
}
