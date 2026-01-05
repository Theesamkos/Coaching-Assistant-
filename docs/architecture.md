graph TB
    subgraph "Users"
        Coach[Coach User]
        Player[Player User]
    end

    subgraph "Frontend - React + Vite"
        CoachDash[Coach Dashboard]
        PlayerDash[Player Dashboard]
        DrillLib[Drill Library]
        Schedule[Schedule Interface]
        VideoUpload[Video Upload]
        AIChat[AI Chat Interface]
        Messaging[Messaging System]
        Analytics[Progress Analytics]
    end

    subgraph "Firebase Services"
        Auth[Firebase Authentication<br/>Google OAuth + Email/Password]
        Firestore[(Firestore Database)]
        Storage[Firebase Storage<br/>Videos & Images]
        RealtimeDB[Realtime Database<br/>Live Updates]
        CloudFunc[Cloud Functions]
        EmailExt[Email Extension<br/>Invitations]
    end

    subgraph "External Services"
        ClaudeAPI[Anthropic Claude API<br/>AI Assistant]
        VideoServices[YouTube/Vimeo<br/>Tutorial Videos]
    end

    subgraph "Data Collections"
        Users[(users)]
        Coaches[(coaches)]
        Players[(players)]
        Invitations[(invitations)]
        Drills[(drills)]
        Sessions[(scheduledSessions)]
        Completions[(completions)]
        Messages[(messages)]
        AIConv[(aiConversations)]
    end

    %% User Connections
    Coach --> CoachDash
    Coach --> DrillLib
    Coach --> Schedule
    Coach --> Messaging
    Coach --> Analytics
    
    Player --> PlayerDash
    Player --> VideoUpload
    Player --> AIChat
    Player --> Messaging
    Player --> Analytics

    %% Frontend to Firebase
    CoachDash --> Auth
    PlayerDash --> Auth
    CoachDash --> Firestore
    PlayerDash --> Firestore
    DrillLib --> Firestore
    Schedule --> Firestore
    VideoUpload --> Storage
    VideoUpload --> Firestore
    AIChat --> CloudFunc
    Messaging --> RealtimeDB
    Analytics --> Firestore

    %% Firebase Internal
    Auth --> Users
    Firestore --> Users
    Firestore --> Coaches
    Firestore --> Players
    Firestore --> Invitations
    Firestore --> Drills
    Firestore --> Sessions
    Firestore --> Completions
    Firestore --> Messages
    Firestore --> AIConv
    
    CloudFunc --> ClaudeAPI
    CloudFunc --> Firestore
    EmailExt --> Invitations

    %% External Services
    DrillLib -.-> VideoServices
    CloudFunc -.-> VideoServices

    %% Key Flows
    Schedule -->|Assigns Drill| Sessions
    Sessions -->|Notifies| RealtimeDB
    VideoUpload -->|Creates| Completions
    Completions -->|Triggers| RealtimeDB
    AIChat -->|Escalates| Messages

    style Coach fill:#4A90E2
    style Player fill:#7ED321
    style ClaudeAPI fill:#FF6B6B
    style Firestore fill:#FFA726
    style Auth fill:#66BB6A
    style Storage fill:#AB47BC