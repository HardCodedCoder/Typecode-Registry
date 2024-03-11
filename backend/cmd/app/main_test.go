package main

import "testing"

func TestSum(t *testing.T) {
	a := 1
	b := 2
	expected := 3
	result := a + b
	if result != expected {
		t.Errorf("expected %d but got %d", expected, result)
	}
}
