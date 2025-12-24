# CollectSystemDocs Workflow - Visual Diagram

## High-Level Overview

```mermaid
graph TB
    Start([Start Workflow]) --> Init[Initialize KB Context]
    Init --> Discover[Discover README Files]
    Discover --> Hash[Calculate File Hashes]
    Hash --> Load[Load Existing Articles]
    Load --> Classify[Classify Changes]
    Classify --> ProcessNew[Process New Files]
    ProcessNew --> ProcessUpdate[Process Updated Files]
    ProcessUpdate --> Report[Generate Report]
    Report --> End([End Workflow])
    
    style Start fill:#4caf50,stroke:#2e7d32,color:#fff
    style End fill:#4caf50,stroke:#2e7d32,color:#fff
    style Init fill:#2196f3,stroke:#1565c0,color:#fff
    style Discover fill:#2196f3,stroke:#1565c0,color:#fff
    style Hash fill:#2196f3,stroke:#1565c0,color:#fff
    style Load fill:#2196f3,stroke:#1565c0,color:#fff
    style Classify fill:#ff9800,stroke:#e65100,color:#fff
    style ProcessNew fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style ProcessUpdate fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style Report fill:#00bcd4,stroke:#006064,color:#fff
```

## Detailed Workflow with Error Handling

```mermaid
graph TD
    A[Start Workflow] --> B[Initialize KB Context]
    B --> B1{KB Service Available?}
    
    B1 -->|Yes| C[Discover README Files]
    B1 -->|No| ERR1[Error: KB Unavailable]
    
    C --> C1{Files Found?}
    C1 -->|Yes| D[Calculate File Hashes]
    C1 -->|No| END1[End: Nothing to Process]
    
    D --> D1[Process Files in Batches]
    D1 --> D2{All Hashed?}
    D2 -->|Yes| E[Load Existing Articles]
    D2 -->|Partial| WARN1[Warning: Some Files Failed]
    
    WARN1 --> E
    
    E --> F[Classify File Changes]
    F --> F1[New Files]
    F --> F2[Updated Files]
    F --> F3[Unchanged Files]
    
    F1 --> G[Process New Files]
    F2 --> H[Process Updated Files]
    F3 --> I[Skip Processing]
    
    G --> G1{Create Articles}
    G1 -->|Success| J[Collect Results]
    G1 -->|Failure| ERR2[Log Failures]
    
    H --> H1{Update Articles}
    H1 -->|Success| J
    H1 -->|Failure| ERR2
    
    ERR2 --> J
    I --> J
    
    J --> K[Generate Report]
    K --> K1[Calculate Statistics]
    K1 --> K2[Log Summary]
    K2 --> L[End Workflow]
    
    ERR1 --> L
    END1 --> L
    
    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style ERR1 fill:#ffcdd2
    style ERR2 fill:#ffcdd2
    style WARN1 fill:#fff3e0
    style END1 fill:#e0e0e0
```

## File Discovery & Classification Flow

```mermaid
graph LR
    A[Scan Paths] --> B[Apply Glob Patterns]
    B --> C[Filter Exclusions]
    C --> D[Check File Stats]
    D --> E{Size OK?}
    
    E -->|Yes| F[Read Content]
    E -->|No| SKIP1[Skip: Too Large]
    
    F --> G[Calculate Hash]
    G --> H{Existing Article?}
    
    H -->|No| NEW[New File]
    H -->|Yes| I{Hash Match?}
    
    I -->|No| UPDATE[Updated File]
    I -->|Yes| SAME[Unchanged File]
    
    NEW --> PROCESS[To Processing Queue]
    UPDATE --> PROCESS
    SAME --> DONE[Skip Processing]
    SKIP1 --> DONE
    
    style A fill:#90caf9
    style PROCESS fill:#ce93d8
    style DONE fill:#a5d6a7
    style SKIP1 fill:#ffcc80
```

## Article Processing Pipeline

```mermaid
flowchart TD
    A[File with Hash] --> B[Extract Title]
    B --> C[Extract Description]
    C --> D[Generate Tags]
    D --> E[Determine Categories]
    E --> F[Build Article Data]
    F --> G{Action Type?}
    
    G -->|Create| H[Call ArticleService.create]
    G -->|Update| I[Call ArticleService.update]
    
    H --> J{Success?}
    I --> J
    
    J -->|Yes| K[Record Success]
    J -->|No| L[Record Failure]
    
    K --> M[Update Metrics]
    L --> N[Log Error Details]
    
    M --> O[Continue Next File]
    N --> O
    
    style A fill:#b3e5fc
    style F fill:#c5cae9
    style K fill:#c8e6c9
    style L fill:#ffcdd2
    style M fill:#dcedc8
    style O fill:#f0f4c3
```

## Parallel Processing Strategy

```mermaid
graph TD
    A[File List] --> B[Split into Batches]
    B --> C[Batch 1: 5 Files]
    B --> D[Batch 2: 5 Files]
    B --> E[Batch N: 5 Files]
    
    C --> C1[Process File 1]
    C --> C2[Process File 2]
    C --> C3[Process File 3]
    C --> C4[Process File 4]
    C --> C5[Process File 5]
    
    D --> D1[Process File 6]
    D --> D2[Process File 7]
    D --> D3[...more files]
    
    E --> E1[Process File N]
    
    C1 & C2 & C3 & C4 & C5 --> F[Await Batch 1]
    D1 & D2 & D3 --> G[Await Batch 2]
    E1 --> H[Await Batch N]
    
    F & G & H --> I[Collect All Results]
    I --> J[Continue Workflow]
    
    style A fill:#fff9c4
    style B fill:#ffecb3
    style F fill:#c8e6c9
    style G fill:#c8e6c9
    style H fill:#c8e6c9
    style I fill:#a5d6a7
```

## Error Handling & Recovery

```mermaid
graph TD
    A[Operation] --> B{Success?}
    B -->|Yes| SUCCESS[Continue]
    B -->|No| C{Error Type?}
    
    C -->|Transient| D[Retry with Backoff]
    C -->|Permanent| E[Log & Skip]
    C -->|Critical| F[Halt Workflow]
    
    D --> G{Max Retries?}
    G -->|No| H[Wait & Retry]
    G -->|Yes| E
    
    H --> A
    E --> I[Add to Failed List]
    I --> SUCCESS
    
    F --> J[Save State]
    J --> K[Notify Admin]
    K --> END[End Workflow]
    
    SUCCESS --> NEXT[Next Operation]
    
    style SUCCESS fill:#c8e6c9
    style E fill:#fff3e0
    style F fill:#ffcdd2
    style END fill:#e0e0e0
```

## State Transitions

```mermaid
stateDiagram-v2
    [*] --> Initializing
    Initializing --> Discovering: KB Ready
    Initializing --> Failed: KB Unavailable
    
    Discovering --> Hashing: Files Found
    Discovering --> Complete: No Files
    
    Hashing --> Loading: Hashes Complete
    Hashing --> Discovering: Partial Failure
    
    Loading --> Classifying: Articles Loaded
    
    Classifying --> Processing: Changes Detected
    Classifying --> Reporting: No Changes
    
    Processing --> Reporting: Processing Complete
    Processing --> Processing: Batch N
    
    Reporting --> Complete: Report Generated
    
    Failed --> [*]
    Complete --> [*]
```

## Data Flow Diagram

```mermaid
graph LR
    FS[File System] -->|Scan| WF[Workflow]
    WF -->|Read| FS
    WF -->|Query| KB[Knowledge Base]
    KB -->|Articles| WF
    WF -->|Create/Update| KB
    WF -->|Log| LOG[Logger]
    WF -->|Metrics| MON[Monitoring]
    WF -->|Report| OUT[Output]
    
    style FS fill:#fff9c4
    style WF fill:#b3e5fc
    style KB fill:#c5cae9
    style LOG fill:#ffccbc
    style MON fill:#f8bbd0
    style OUT fill:#c8e6c9
```

## Performance Optimization

```mermaid
graph TD
    A[File Processing] --> B{Optimization Level}
    
    B -->|Sequential| C[Process 1 by 1]
    B -->|Parallel| D[Process in Batches]
    
    D --> E[Batch Size: 5]
    E --> F[Hash Calculation: 10 Parallel]
    
    F --> G[Memory Management]
    G --> H[Stream Large Files]
    G --> I[Clear After Process]
    
    H --> J[Performance Metrics]
    I --> J
    
    J --> K[Avg Time/File]
    J --> L[Peak Memory]
    J --> M[Total Duration]
    
    style D fill:#c8e6c9
    style E fill:#a5d6a7
    style F fill:#a5d6a7
    style J fill:#90caf9
```

## Workflow Lifecycle

```mermaid
sequenceDiagram
    participant U as User/Scheduler
    participant W as Workflow
    participant FS as File System
    participant KB as Knowledge Base
    participant L as Logger
    
    U->>W: Start Workflow
    activate W
    
    W->>KB: Initialize Context
    KB-->>W: KB Ready
    
    W->>FS: Discover Files
    FS-->>W: File List
    
    W->>FS: Read & Hash Files
    FS-->>W: File Manifest
    
    W->>KB: Load Existing Articles
    KB-->>W: Article Map
    
    W->>W: Classify Changes
    
    loop For Each New/Updated File
        W->>KB: Create/Update Article
        KB-->>W: Article Created
        W->>L: Log Progress
    end
    
    W->>W: Generate Report
    W->>L: Log Summary
    
    W-->>U: Workflow Complete
    deactivate W
```

## Integration Points

```mermaid
graph TD
    A[CollectSystemDocs Workflow] --> B[KB Services]
    A --> C[File System]
    A --> D[Logging System]
    A --> E[Monitoring]
    
    B --> B1[KnowledgeBaseService]
    B --> B2[ArticleService]
    B --> B3[SearchService]
    
    C --> C1[File Reading]
    C --> C2[Path Resolution]
    C --> C3[Glob Matching]
    
    D --> D1[Structured Logging]
    D --> D2[Error Tracking]
    
    E --> E1[Metrics Collection]
    E --> E2[Performance Stats]
    
    style A fill:#64b5f6
    style B fill:#9575cd
    style C fill:#4db6ac
    style D fill:#ffb74d
    style E fill:#f06292
```

## Legend

### Color Coding

- 🟦 **Blue**: Initialization & Setup Steps
- 🟪 **Purple**: Processing Operations
- 🟧 **Orange**: Decision Points
- 🟩 **Green**: Success States
- 🟥 **Red**: Error States
- 🟨 **Yellow**: Warning States
- ⬜ **Gray**: Terminal States

### Symbol Guide

- **Rectangle**: Process/Action
- **Diamond**: Decision Point
- **Rounded Rectangle**: Start/End
- **Cylinder**: Data Store
- **Hexagon**: External Service
- **Parallelogram**: Input/Output
