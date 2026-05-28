#!/bin/bash

# =============================================================================
# Blueee - Universal AI Provider Connector for Claude Code
# =============================================================================

# ANSI Color Variables
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# =============================================================================
# 1. Banner
# =============================================================================
print_banner() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo '  ____  ____  ___  ____  ____  ____  ____  ____  ____  ____  ____ '
    echo ' |___||___||___||___||___||___||___||___||___||___||___||___| '
    echo '  ____  ____  ____  ____  ____  ____  ____  ____  ____  ____  ____ '
    echo ' |    ||    ||    ||    ||    ||    ||    ||    ||    ||    ||    |'
    echo -e "${NC}"
    echo -e "${CYAN}${BOLD}    Blueee${NC} - Universal AI Connector for Claude Code"
    echo ""
}

# =============================================================================
# 2. Dependency Check & Auto-Install
# =============================================================================
check_dependencies() {
    echo -e "${CYAN}⟳ Checking dependencies...${NC}"
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS="debian"
        elif command -v yum &> /dev/null; then
            OS="rhel"
        fi
    fi
    
    # Check and install curl
    if ! command -v curl &> /dev/null; then
        echo -e "${YELLOW}Installing curl...${NC}"
        case "$OS" in
            macos)    brew install curl ;;
            debian)   sudo apt-get update && sudo apt-get install -y curl ;;
            rhel)     sudo yum install -y curl ;;
        esac
    fi
    
    # Check and install jq
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Installing jq...${NC}"
        case "$OS" in
            macos)    brew install jq ;;
            debian)   sudo apt-get update && sudo apt-get install -y jq ;;
            rhel)     sudo yum install -y jq ;;
        esac
    fi
    
    # Check Node.js (do NOT install, just warn)
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Check Claude Code CLI
    if ! command -v claude &> /dev/null; then
        echo -e "${RED}✗ Claude Code is not installed.${NC}"
        echo -e "${YELLOW}Install it first: npm install -g @anthropic-ai/claude-code${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All dependencies satisfied${NC}"
    echo ""
}

# =============================================================================
# 3. Provider Selection Menu
# =============================================================================
select_provider() {
    echo -e "${BOLD}Select your AI Provider:${NC}"
    echo ""
    echo "  [1] BluesMinds   (api.bluesminds.com)"
    echo "  [2] Nvidia NIM   (integrate.api.nvidia.com)"
    echo "  [3] Google Gemini (generativelanguage.googleapis.com)"
    echo "  [4] Grok / xAI   (api.x.ai)"
    echo "  [5] Cerebras     (api.cerebras.ai)"
    echo "  [6] Mistral      (api.mistral.ai)"
    echo ""
    
    read -p "Enter your choice [1-6]: " choice
    
    case "$choice" in
        1) PROVIDER="BluesMinds"; BASE_URL="https://api.bluesminds.com/v1"; MODELS_ENDPOINT="/v1/models"; AUTH_TYPE="bearer" ;;
        2) PROVIDER="Nvidia"; BASE_URL="https://integrate.api.nvidia.com/v1"; MODELS_ENDPOINT="/v1/models"; AUTH_TYPE="bearer" ;;
        3) PROVIDER="Gemini"; BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"; MODELS_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models"; AUTH_TYPE="query_param" ;;
        4) PROVIDER="Grok"; BASE_URL="https://api.x.ai/v1"; MODELS_ENDPOINT="/v1/models"; AUTH_TYPE="bearer" ;;
        5) PROVIDER="Cerebras"; BASE_URL="https://api.cerebras.ai/v1"; MODELS_ENDPOINT="/v1/models"; AUTH_TYPE="bearer" ;;
        6) PROVIDER="Mistral"; BASE_URL="https://api.mistral.ai/v1"; MODELS_ENDPOINT="/v1/models"; AUTH_TYPE="bearer" ;;
        *) echo -e "${RED}✗ Invalid choice. Exiting.${NC}"; exit 1 ;;
    esac
    
    echo -e "${GREEN}✓ Selected: $PROVIDER${NC}"
    echo ""
}

# =============================================================================
# 5. API Key Input
# =============================================================================
get_api_key() {
    echo -e "${BOLD}Enter your $PROVIDER API Key:${NC}"
    read -s -p "> " API_KEY
    echo ""
    
    if [[ -z "$API_KEY" ]]; then
        echo -e "${RED}✗ API key cannot be empty. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ API key received${NC}"
    echo ""
}

# =============================================================================
# 6. Fetch & Parse Models
# =============================================================================
fetch_models() {
    echo -e "${CYAN}⟳ Fetching models from $PROVIDER...${NC}"
    
    if [[ "$AUTH_TYPE" == "bearer" ]]; then
        RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL$MODELS_ENDPOINT")
    elif [[ "$AUTH_TYPE" == "query_param" ]]; then
        RESPONSE=$(curl -s "$MODELS_ENDPOINT?key=$API_KEY")
    fi
    
    # Check for errors
    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message // .error // "Unknown error"')
        echo -e "${RED}✗ Error fetching models: $ERROR_MSG${NC}"
        echo -e "${YELLOW}Raw response: $RESPONSE${NC}"
        exit 1
    fi
    
    # Parse models based on provider
    if [[ "$PROVIDER" == "Gemini" ]]; then
        MODELS=$(echo "$RESPONSE" | jq -r '.models[].name' 2>/dev/null | sed 's/models\///' | head -30)
    else
        MODELS=$(echo "$RESPONSE" | jq -r '.data[].id' 2>/dev/null | head -30)
    fi
    
    if [[ -z "$MODELS" ]]; then
        echo -e "${RED}✗ No models found or invalid response${NC}"
        echo -e "${YELLOW}Raw response: $RESPONSE${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Fetched models successfully${NC}"
    echo ""
}

# =============================================================================
# 7. Model Selection
# =============================================================================
select_model() {
    echo -e "${BOLD}Available Models:${NC}"
    echo ""
    
    # Convert to array
    mapfile -t MODEL_ARRAY <<< "$MODELS"
    
    for i in "${!MODEL_ARRAY[@]}"; do
        echo "  [$((i+1))] ${MODEL_ARRAY[$i]}"
    done
    echo ""
    
    read -p "Select a model [1-${#MODEL_ARRAY[@]}]: " model_choice
    
    if ! [[ "$model_choice" =~ ^[0-9]+$ ]] || [ "$model_choice" -lt 1 ] || [ "$model_choice" -gt "${#MODEL_ARRAY[@]}" ]; then
        echo -e "${RED}✗ Invalid selection. Exiting.${NC}"
        exit 1
    fi
    
    SELECTED_MODEL="${MODEL_ARRAY[$((model_choice-1))]}"
    
    echo -e "${GREEN}✓ Selected: $SELECTED_MODEL${NC}"
    echo ""
}

# =============================================================================
# 8. Connect to Claude Code
# =============================================================================
connect_to_claude() {
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  Connecting to Claude Code${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Provider : ${CYAN}$PROVIDER${NC}"
    echo -e "  Model    : ${CYAN}$SELECTED_MODEL${NC}"
    echo -e "  Endpoint : ${CYAN}$BASE_URL${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    sleep 1
    
    export ANTHROPIC_API_KEY="$API_KEY"
    export ANTHROPIC_BASE_URL="$BASE_URL"
    
    exec claude --model "$SELECTED_MODEL"
}

# =============================================================================
# Main Execution
# =============================================================================
main() {
    print_banner
    check_dependencies
    select_provider
    get_api_key
    fetch_models
    select_model
    connect_to_claude
}

main "$@"