package data

type Range struct {
	Start int32
	End   int32
}

const (
	ScopeShared  = "Shared"
	ScopeHybris  = "Hybris"
	ScopeProject = "Project"
)

var ScopeRanges = map[string]Range{
	ScopeShared:  {Start: 20000, End: int32(^uint32(0) >> 1)},
	ScopeHybris:  {Start: 0, End: 10000},
	ScopeProject: {Start: 14000, End: 19999},
}
