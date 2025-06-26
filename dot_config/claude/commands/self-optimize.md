# /self-optimize Command Manual

## Overview

- **Purpose**: Immediate self-optimization analysis to identify and resolve performance bottlenecks in real-time
- **Trigger Conditions**:
  - Manual user invocation
  - Decision hesitation >3 seconds detected
  - Performance degradation noticed
  - After completing complex tasks
- **Expected Outcome**: Actionable improvement recommendations with implementation priority

## Execution Protocol

### Phase 1: Current State Analysis

1. **Recent Performance Review**
   - Analyze last 3-5 completed tasks
   - Measure decision time patterns
   - Identify recurring hesitation points
   - Review tool usage efficiency

2. **Error Pattern Detection**
   - Scan for repeated mistakes
   - Identify knowledge gaps
   - Analyze user feedback patterns
   - Check for consistency issues

3. **Advanced Trigger Detection**
   - **Quantitative Triggers**:
     - Decision hesitation >3 seconds
     - Task completion rate <95%
     - Error rate >10%
     - Tool efficiency <85%
   - **Qualitative Triggers**:
     - User frustration keywords ("confusing", "slow", "wrong")
     - Context misalignment patterns
     - Communication breakdown indicators
   - **Trend Analysis Triggers**:
     - Performance degradation over time
     - Recurring error patterns (≥3 occurrences)
     - User behavior changes

4. **User Satisfaction Monitoring**
   - **Positive Indicators**: "helpful", "clear", "efficient", "perfect"
   - **Negative Indicators**: "confusing", "slow", "wrong", "unhelpful"
   - **Clarification Frequency**: Track requests per task (target: <2)
   - **Task Abandonment**: Monitor user switching approaches
   - **Correction Frequency**: User needing to correct AI decisions

### Phase 2: Deep Problem Analysis

1. **Use mcp__sequential-thinking__sequentialthinking**
   - Set thought_number: 1, total_thoughts: 5-8
   - Deep dive into identified issues
   - Root cause analysis
   - Pattern recognition

2. **Bottleneck Identification**
   - Decision-making delays
   - Tool selection inefficiencies
   - Communication clarity issues
   - Process optimization opportunities

### Phase 3: Solution Generation

1. **Improvement Strategy Design**
   - Specific actionable solutions
   - Quick wins vs. long-term improvements
   - Resource requirements assessment
   - Risk evaluation

2. **Priority Matrix Creation**
   - Impact vs. effort analysis
   - Urgency classification
   - Implementation feasibility

### Phase 4: Implementation Planning

1. **Action Plan Creation**
   - Step-by-step implementation guide
   - Timeline estimation
   - Success metrics definition
   - Rollback procedures

2. **User Proposal Generation**
   - Clear problem statement
   - Proposed solutions with rationale
   - Expected benefits quantification
   - Implementation timeline

## Required Tools

- **mcp__sequential-thinking__sequentialthinking** (mandatory for deep analysis)
- **TodoWrite** (for action item creation)
- **Read** (for reviewing recent outputs if needed)

## Success Criteria

- **Clarity**: Problems clearly identified and articulated
- **Actionability**: Solutions are specific and implementable
- **Prioritization**: Clear order of implementation established
- **Measurability**: Success metrics defined for each improvement
- **User Value**: Improvements directly benefit user experience

## Examples

### Example 1: Decision Hesitation Issue

```
Problem: Taking 5+ seconds to choose between Grep and Task tool
Analysis: Unclear decision criteria in current prompt
Solution: Add specific tool selection flowchart to prompt
Priority: High (affects every search task)
Implementation: Update EXECUTION CORE section with decision tree
```

### Example 2: Repetitive Error Pattern

```
Problem: Consistently forgetting to run lint after code changes
Analysis: Missing reminder in workflow
Solution: Add lint check to Quality Gates checklist
Priority: Medium (affects code quality)
Implementation: Update WORKFLOW PROTOCOL validation checklist
```

## Troubleshooting

### Common Issues

1. **Analysis Too Shallow**
   - Symptom: Generic recommendations without specific details
   - Solution: Use mcp__sequential-thinking__sequentialthinking with more thoughts (6-10)
   - Prevention: Always start with concrete examples

2. **Solutions Too Vague**
   - Symptom: Recommendations like "be more efficient"
   - Solution: Focus on specific, measurable changes
   - Prevention: Include implementation steps for each solution

3. **Priority Unclear**
   - Symptom: All improvements marked as high priority
   - Solution: Use impact/effort matrix for objective prioritization
   - Prevention: Always consider implementation cost vs. benefit

### Recovery Procedures

1. **If analysis is incomplete**: Re-run with extended thinking process
2. **If solutions are not actionable**: Break down into smaller, specific steps
3. **If priorities conflict**: Reassess based on user impact and implementation effort

## Integration with Auto-Improvement System

This command integrates with the AUTO-IMPROVEMENT SYSTEM by:

- Providing immediate response to performance triggers
- Feeding insights into continuous learning integration
- Supporting proactive enhancement schedule
- Enabling rapid iteration on system improvements

---
*This manual ensures consistent, high-quality self-optimization that drives continuous performance improvement.*
