# CollectSystemDocs Workflow - Quick Start Guide

## Overview

Get the CollectSystemDocs workflow up and running in 5 minutes.

## Prerequisites

✅ Reactory server running  
✅ `reactory-kb` module enabled  
✅ Access to server environment  
✅ Basic understanding of Reactory workflows  

## Step 1: Verify Installation

Check that the workflow is registered:

```bash
# From server directory
bin/cli.sh workflow:list | grep CollectSystemDocs
```

Expected output:
```
kb.CollectSystemDocsWorkflow@1.0.0
```

## Step 2: Set Environment Variables

Create or update your `.env` file:

```bash
# Required
KB_SYSTEM_USER=system@reactory.io
KB_SYSTEM_PARTNER=reactory

# Optional (with defaults)
KB_SYSTEM_DOCS_NAME="System Documentation"
KB_SYSTEM_DOCS_AUTO_CREATE=true
KB_DOCS_MAX_FILE_SIZE=5242880
KB_DOCS_PARALLEL_LIMIT=5
```

## Step 3: Test with Dry Run

Execute a dry run to preview what would happen:

```bash
# Via CLI
bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0 --data '{"dryRun":true}'
```

Or via GraphQL:

```graphql
mutation TestCollectDocs {
  startWorkflow(
    workflowId: "kb.CollectSystemDocsWorkflow@1.0.0"
    input: {
      data: {
        dryRun: true
        forceFullScan: false
      }
    }
  ) {
    id
    status
    startedAt
  }
}
```

## Step 4: Review Logs

Check the output:

```bash
# Follow logs in real-time
tail -f logs/reactory-$(date +%Y-%m-%d).log | grep CollectSystemDocs

# Or search after completion
grep "CollectSystemDocs" logs/reactory-*.log | tail -50
```

Look for:
- ✅ Files discovered
- ✅ Processing summary
- ❌ Any errors or warnings

## Step 5: Run First Real Execution

If dry run looks good, execute for real:

```bash
bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0
```

Or via GraphQL:

```graphql
mutation RunCollectDocs {
  startWorkflow(
    workflowId: "kb.CollectSystemDocsWorkflow@1.0.0"
    input: {
      data: {
        forceFullScan: true  # First run should be full scan
      }
    }
  ) {
    id
    status
  }
}
```

## Step 6: Verify Results

### Check Knowledge Base

```graphql
query GetSystemDocsKB {
  knowledgeBases(filter: { slug: "system-documentation" }) {
    id
    title
    description
    articleCount
  }
}
```

### Check Articles

```graphql
query GetSystemDocArticles {
  articles(filter: { 
    knowledgeBaseId: "YOUR_KB_ID"
    tags: ["system-documentation"]
  }) {
    id
    title
    slug
    metadata {
      sourcePath
      moduleId
      lastSynced
    }
  }
}
```

## Step 7: Set Up Scheduling (Optional)

Create a workflow schedule configuration:

```json
{
  "id": "daily-docs-sync",
  "name": "Daily Documentation Sync",
  "workflowId": "kb.CollectSystemDocsWorkflow@1.0.0",
  "cron": "0 2 * * *",
  "enabled": true,
  "params": {
    "forceFullScan": false
  }
}
```

## Common Scenarios

### Scenario 1: Quick Module Documentation Update

After adding a new module with README:

```bash
bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0 \
  --data '{"targetPaths":["src/modules/my-new-module/README.md"]}'
```

### Scenario 2: Force Full Refresh

To rebuild entire documentation KB:

```bash
bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0 \
  --data '{"forceFullScan":true}'
```

### Scenario 3: Specific Module Only

Update only one module's documentation:

```bash
bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0 \
  --data '{"targetPaths":["src/modules/reactory-kb/**/*.md"]}'
```

## Troubleshooting Quick Fixes

### Issue: No files found

**Solution**:
```bash
# Verify REACTORY_SERVER env var
echo $REACTORY_SERVER

# Check if READMEs exist
ls -la $REACTORY_SERVER/src/modules/*/README.md
```

### Issue: Permission errors

**Solution**:
```bash
# Check file permissions
ls -la $REACTORY_SERVER/src/modules/

# Run with sudo (not recommended for production)
sudo bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0
```

### Issue: KB not created

**Solution**:
```bash
# Ensure auto-create is enabled
export KB_SYSTEM_DOCS_AUTO_CREATE=true

# Or create manually via GraphQL
mutation CreateKB {
  createKnowledgeBase(input: {
    title: "System Documentation"
    description: "Platform documentation"
    visibility: PUBLIC
  }) {
    id
  }
}
```

### Issue: Out of memory

**Solution**:
```bash
# Reduce parallel processing
export KB_DOCS_PARALLEL_LIMIT=2

# Increase Node.js heap
NODE_OPTIONS="--max-old-space-size=4096" bin/cli.sh workflow:run ...
```

## What's Next?

After successful setup:

1. **Monitor Execution**
   - Review logs regularly
   - Check execution times
   - Monitor memory usage

2. **Customize Paths**
   - Add your specific documentation locations
   - Exclude unnecessary paths
   - Adjust for your module structure

3. **Set Up Automation**
   - Configure scheduled runs
   - Integrate with CI/CD
   - Add webhook notifications

4. **Optimize Performance**
   - Adjust parallel limits
   - Fine-tune batch sizes
   - Monitor and improve

## Getting Help

### Documentation
- [Full README](./README.md) - Complete user guide
- [Specification](./CollectSystemDocsWorkflow.specification.md) - Technical spec
- [Diagrams](./workflow-diagram.md) - Visual documentation

### Support Channels
- Review workflow logs
- Check KB module documentation
- Consult Reactory workflow system docs

### Debug Mode

Enable verbose logging:

```bash
DEBUG=reactory:kb:* \
  bin/cli.sh workflow:run kb.CollectSystemDocsWorkflow@1.0.0
```

## Success Checklist

After first run, verify:

- [ ] Workflow completes successfully
- [ ] "System Documentation" KB exists
- [ ] Articles created for README files
- [ ] No critical errors in logs
- [ ] Execution time is reasonable
- [ ] Memory usage is acceptable

## Next Steps

Once basic workflow is running:

1. Read the [complete README](./README.md)
2. Review the [specification](./CollectSystemDocsWorkflow.specification.md)
3. Customize for your needs
4. Set up monitoring
5. Configure scheduling

---

**Time to First Success**: ~5 minutes  
**Difficulty**: Easy  
**Support**: See documentation links above  

Happy documenting! 📚
