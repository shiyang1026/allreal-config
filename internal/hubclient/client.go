package hubclient

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"allreal-config/internal/apptypes"
)

type Client struct {
	httpClient *http.Client
	serverURL  string
}

func New(httpClient *http.Client, serverURL string) *Client {
	return &Client{httpClient: httpClient, serverURL: strings.TrimRight(serverURL, "/")}
}

func (c *Client) WithServerURL(serverURL string) *Client {
	return New(c.httpClient, serverURL)
}

func (c *Client) CheckServer(serverURL string) (*apptypes.ServerStatus, string, error) {
	serverURL = strings.TrimRight(serverURL, "/")
	resp, err := c.httpClient.Get(serverURL + "/api/status")
	if err != nil {
		return nil, "", fmt.Errorf("无法连接服务器: %v", err)
	}
	defer resp.Body.Close()

	var apiResp apptypes.APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, "", fmt.Errorf("响应解析失败: %v", err)
	}

	var status apptypes.ServerStatus
	if err := json.Unmarshal(apiResp.Data, &status); err != nil {
		if err2 := json.Unmarshal(mustMarshal(apiResp), &status); err2 != nil {
			return nil, "", fmt.Errorf("状态解析失败")
		}
	}
	return &status, serverURL, nil
}

func (c *Client) Login(username, password string) (*apptypes.UserInfo, error) {
	body := fmt.Sprintf(`{"username":"%s","password":"%s"}`, username, password)
	resp, err := c.httpClient.Post(c.serverURL+"/api/user/login", "application/json", strings.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("连接失败: %v", err)
	}
	defer resp.Body.Close()

	var apiResp apptypes.APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("响应解析失败")
	}
	if !apiResp.Success {
		return nil, fmt.Errorf("%s", apiResp.Message)
	}

	var user apptypes.UserInfo
	if err := json.Unmarshal(apiResp.Data, &user); err != nil {
		return nil, fmt.Errorf("用户信息解析失败")
	}
	return &user, nil
}

func (c *Client) GenerateAccessToken(userID int) (string, error) {
	req, err := http.NewRequest("GET", c.serverURL+"/api/user/token", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("New-Api-User", fmt.Sprintf("%d", userID))
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var apiResp apptypes.APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return "", err
	}
	if !apiResp.Success {
		return "", fmt.Errorf("%s", apiResp.Message)
	}

	var token string
	if err := json.Unmarshal(apiResp.Data, &token); err != nil {
		return "", err
	}
	return token, nil
}

func (c *Client) GetTokens(accessToken string, userID int) (*apptypes.TokenListResponse, error) {
	req, _ := http.NewRequest("GET", c.serverURL+"/api/token/?p=0&size=100", nil)
	setAuthHeaders(req, accessToken, userID)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	var apiResp apptypes.APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("解析失败")
	}
	if !apiResp.Success {
		return nil, fmt.Errorf("%s", apiResp.Message)
	}

	var tokenList apptypes.TokenListResponse
	if err := json.Unmarshal(apiResp.Data, &tokenList); err != nil {
		return nil, err
	}
	return &tokenList, nil
}

func (c *Client) RevealTokenKey(tokenID int, accessToken string, userID int) (string, error) {
	req, _ := http.NewRequest("POST", fmt.Sprintf("%s/api/token/%d/key", c.serverURL, tokenID), nil)
	setAuthHeaders(req, accessToken, userID)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	var apiResp apptypes.APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return "", fmt.Errorf("解析失败")
	}
	if !apiResp.Success {
		return "", fmt.Errorf("%s", apiResp.Message)
	}

	var data struct {
		Key string `json:"key"`
	}
	if err := json.Unmarshal(apiResp.Data, &data); err != nil {
		return "", err
	}
	key := data.Key
	if !strings.HasPrefix(key, "sk-") {
		key = "sk-" + key
	}
	return key, nil
}

func (c *Client) GetClaudeCodeModels(tokenKey string) ([]apptypes.ModelOption, error) {
	req, err := http.NewRequest("GET", c.serverURL+"/v1/models", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-api-key", tokenKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求模型列表失败: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取模型列表失败: %v", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("模型列表请求失败: HTTP %d", resp.StatusCode)
	}

	var raw struct {
		Data []struct {
			ID          string `json:"id"`
			DisplayName string `json:"display_name"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("模型列表解析失败: %v", err)
	}

	models := make([]apptypes.ModelOption, 0, len(raw.Data))
	for _, item := range raw.Data {
		id := strings.TrimSpace(item.ID)
		if id == "" {
			continue
		}
		displayName := strings.TrimSpace(item.DisplayName)
		if displayName == "" {
			displayName = id
		}
		models = append(models, apptypes.ModelOption{ID: id, DisplayName: displayName})
	}
	if len(models) == 0 {
		return nil, fmt.Errorf("当前令牌没有可用模型")
	}
	return models, nil
}

func (c *Client) GetCodexModels(tokenKey string) ([]apptypes.ModelOption, error) {
	req, err := http.NewRequest("GET", c.serverURL+"/v1/models", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+tokenKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求模型列表失败: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取模型列表失败: %v", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("模型列表请求失败: HTTP %d", resp.StatusCode)
	}

	var raw struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("模型列表解析失败: %v", err)
	}

	models := make([]apptypes.ModelOption, 0, len(raw.Data))
	for _, item := range raw.Data {
		id := strings.TrimSpace(item.ID)
		if id == "" {
			continue
		}
		models = append(models, apptypes.ModelOption{ID: id, DisplayName: id})
	}
	if len(models) == 0 {
		return nil, fmt.Errorf("当前令牌没有可用模型")
	}
	return models, nil
}

func setAuthHeaders(req *http.Request, accessToken string, userID int) {
	req.Header.Set("Authorization", accessToken)
	if userID > 0 {
		req.Header.Set("New-Api-User", fmt.Sprintf("%d", userID))
	}
}

func mustMarshal(v interface{}) []byte {
	data, _ := json.Marshal(v)
	return data
}
