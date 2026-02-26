import { FlowData } from "@/types/flow";

export const mockFlowData: FlowData = {
  categories: [
    { id: "cat-source", label: "SOURCE TOPICS", x: 30, y: 80, color: "cyan" },
    { id: "cat-repos", label: "REPOSITORIES", x: 30, y: 400, color: "green" },
    { id: "cat-dest", label: "DESTINATION TOPICS", x: 1050, y: 50, color: "purple" },
    { id: "cat-datalake", label: "DATA LAKE", x: 1050, y: 290, color: "green" },
    { id: "cat-siem", label: "SIEM", x: 1050, y: 350, color: "purple" },
    { id: "cat-edr", label: "EDR", x: 1050, y: 540, color: "orange" },
  ],
  nodes: [
    // Source nodes
    { id: "src-1", label: "prod-winlogbeat", x: 80, y: 130, type: "source", color: "cyan" },
    { id: "src-2", label: "prod-kubernetes-dev", x: 80, y: 170, type: "source", color: "cyan" },
    { id: "src-3", label: "prod-kubernetes-prod", x: 80, y: 210, type: "source", color: "cyan" },
    { id: "src-4", label: "prod-o365audit", x: 80, y: 250, type: "source", color: "cyan" },
    { id: "src-5", label: "prod-cloudtrail", x: 80, y: 290, type: "source", color: "cyan" },

    // Processing nodes
    { id: "proc-events", label: "EVENTS/SEC", x: 380, y: 210, type: "metric", value: "19609", color: "cyan", size: 70 },
    { id: "proc-pipeline", label: "DETECTION PIPELINES", x: 570, y: 210, type: "metric", value: "3", subLabel: "+1 +1", color: "cyan", size: 80 },
    { id: "proc-tagged", label: "TAGGED/SEC", x: 760, y: 210, type: "metric", value: "41", color: "purple", size: 70 },

    // Rules nodes
    { id: "rules-1", label: "# RULES", x: 380, y: 380, type: "metric", value: "6500", color: "green", size: 60 },
    { id: "rules-2", label: "# RULES", x: 380, y: 520, type: "metric", value: "3000", color: "green", size: 60 },
    { id: "rules-staging", label: "STAGING STATS", x: 570, y: 520, type: "metric", value: "1245", subLabel: "+25", color: "green", size: 70 },
    { id: "rules-deployed", label: "RULES DEPLOYED", x: 760, y: 520, type: "metric", value: "1500", color: "green", size: 70 },

    // MITRE node
    { id: "mitre", label: "MITRE T&E", x: 760, y: 370, type: "process", subLabel: "ATTACK CHAIN", color: "purple", size: 65 },

    // Repository nodes
    { id: "repo-1", label: "SOC Prime Premium Rules", x: 80, y: 440, type: "source", color: "green" },
    { id: "repo-2", label: "SOC Prime AI Rules", x: 80, y: 480, type: "source", color: "green" },
    { id: "repo-3", label: "DEV Stage Rules", x: 80, y: 520, type: "source", color: "green" },
    { id: "repo-4", label: "PRODUCTION Rules", x: 80, y: 560, type: "source", color: "green" },

    // Destination nodes
    { id: "dest-1", label: "prod-cloudtrail-tagg...", x: 1080, y: 90, type: "destination", color: "purple" },
    { id: "dest-2", label: "prod-windows-tagged", x: 1080, y: 125, type: "destination", color: "purple" },
    { id: "dest-3", label: "prod-office-365-tagg...", x: 1080, y: 160, type: "destination", color: "purple" },
    { id: "dest-4", label: "prod-kubernetes-de...", x: 1080, y: 195, type: "destination", color: "purple" },
    { id: "dest-5", label: "prod-kubernetes-pr...", x: 1080, y: 230, type: "destination", color: "purple" },

    // SIEM/DataLake destinations
    { id: "dl-1", label: "AWS Security Lake", x: 1080, y: 310, type: "destination", color: "green" },
    { id: "siem-1", label: "Splunk", x: 1080, y: 380, type: "destination", color: "purple" },
    { id: "siem-2", label: "QRadar", x: 1080, y: 415, type: "destination", color: "purple" },
    { id: "siem-3", label: "ArcSight", x: 1080, y: 450, type: "destination", color: "purple" },
    { id: "siem-4", label: "LogRhythm", x: 1080, y: 485, type: "destination", color: "purple" },
    { id: "siem-5", label: "Sentinel", x: 1080, y: 520, type: "destination", color: "purple" },

    // EDR
    { id: "edr-1", label: "Microsoft Defender", x: 1080, y: 570, type: "destination", color: "orange" },
    { id: "edr-2", label: "AIDR Bastion", x: 1080, y: 605, type: "destination", color: "orange" },
  ],
  edges: [
    // Sources to events
    { id: "e1", from: "src-1", to: "proc-events", color: "cyan", particleCount: 8, speed: 1.2 },
    { id: "e2", from: "src-2", to: "proc-events", color: "cyan", particleCount: 6, speed: 1.0 },
    { id: "e3", from: "src-3", to: "proc-events", color: "cyan", particleCount: 10, speed: 1.5 },
    { id: "e4", from: "src-4", to: "proc-events", color: "cyan", particleCount: 5, speed: 0.8 },
    { id: "e5", from: "src-5", to: "proc-events", color: "cyan", particleCount: 7, speed: 1.1 },

    // Events to pipeline
    { id: "e6", from: "proc-events", to: "proc-pipeline", color: "cyan", particleCount: 12, speed: 1.3 },

    // Pipeline to tagged
    { id: "e7", from: "proc-pipeline", to: "proc-tagged", color: "purple", particleCount: 8, speed: 1.0 },

    // Tagged to destinations
    { id: "e8", from: "proc-tagged", to: "dest-1", color: "purple", particleCount: 4, speed: 1.2 },
    { id: "e9", from: "proc-tagged", to: "dest-2", color: "purple", particleCount: 3, speed: 1.0 },
    { id: "e10", from: "proc-tagged", to: "dest-3", color: "purple", particleCount: 3, speed: 0.9 },
    { id: "e11", from: "proc-tagged", to: "dest-4", color: "purple", particleCount: 3, speed: 1.1 },
    { id: "e12", from: "proc-tagged", to: "dest-5", color: "purple", particleCount: 3, speed: 1.0 },

    // Tagged to MITRE
    { id: "e13", from: "proc-tagged", to: "mitre", color: "purple", particleCount: 5, speed: 0.8 },

    // MITRE to SIEMs
    { id: "e14", from: "mitre", to: "dl-1", color: "green", particleCount: 3, speed: 0.9 },
    { id: "e15", from: "mitre", to: "siem-1", color: "purple", particleCount: 3, speed: 1.0 },
    { id: "e16", from: "mitre", to: "siem-2", color: "purple", particleCount: 2, speed: 0.8 },
    { id: "e17", from: "mitre", to: "siem-3", color: "purple", particleCount: 2, speed: 0.9 },
    { id: "e18", from: "mitre", to: "siem-4", color: "purple", particleCount: 2, speed: 1.0 },
    { id: "e19", from: "mitre", to: "siem-5", color: "purple", particleCount: 2, speed: 0.9 },
    { id: "e20", from: "mitre", to: "edr-1", color: "orange", particleCount: 3, speed: 1.1 },
    { id: "e21", from: "mitre", to: "edr-2", color: "orange", particleCount: 2, speed: 0.8 },

    // Repos to rules
    { id: "e22", from: "repo-1", to: "rules-1", color: "green", particleCount: 5, speed: 0.7 },
    { id: "e23", from: "repo-2", to: "rules-1", color: "green", particleCount: 4, speed: 0.8 },
    { id: "e24", from: "repo-3", to: "rules-2", color: "green", particleCount: 4, speed: 0.9 },
    { id: "e25", from: "repo-4", to: "rules-2", color: "green", particleCount: 3, speed: 0.7 },

    // Rules flow
    { id: "e26", from: "rules-2", to: "rules-staging", color: "green", particleCount: 6, speed: 1.0 },
    { id: "e27", from: "rules-staging", to: "rules-deployed", color: "green", particleCount: 8, speed: 1.2 },

    // Rules to pipeline
    { id: "e28", from: "rules-1", to: "proc-pipeline", color: "green", particleCount: 5, speed: 0.9 },
  ],
};
