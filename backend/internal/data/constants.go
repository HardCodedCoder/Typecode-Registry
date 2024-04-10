package data

// Range defines a range of typecodes.
type Range struct {
	Start int32
	End   int32
}

// Scope constants
const (
	ScopeShared  = "Shared"
	ScopeHybris  = "Hybris"
	ScopeProject = "Project"
)

// ScopeRanges defines the ranges of typecodes for each scope.
// The ranges are used to determine the next free typecode for a new item.
var ScopeRanges = map[string]Range{
	ScopeShared:  {Start: 20000, End: int32(^uint32(0) >> 1)},
	ScopeHybris:  {Start: 0, End: 10000},
	ScopeProject: {Start: 14000, End: 19999},
}
