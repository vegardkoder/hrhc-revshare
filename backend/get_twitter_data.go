package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"os"
	"os/exec"
	"reflect"

	"time"

	"github.com/portto/solana-go-sdk/client"
	"github.com/portto/solana-go-sdk/rpc"
)

const bearer = "Bearer " + "TOKEN"

type Tweet struct {
	edit_history_tweet_ids []string
	id                     string
	text                   string
}

type Users struct {
	Users []User `json:"users"`
}
type User struct {
	PubKey    string `json:"pubKey"`
	TwitterId string `json:"twitterId"`
	Points    int    `json:"points"`
	Claim     int    `json:"claim"`
}

type Staked struct {
	Owner string `json:"owner"`
	Mint  string `json:"mint"`
}

func updateClaim() {
	cmd := exec.Command(`E:\hrhc-revshare\backend\stake\run.bat`)
	stdout, err := cmd.Output()
	log.Println("std", stdout, "err", err)

	stakeUsers, _ := os.Open(`E:\hrhc-revshare\backend\stake\stakedAccounts.json`)
	byteStakeVal, _ := ioutil.ReadAll(stakeUsers)
	var stakedUsers []Staked

	json.Unmarshal(byteStakeVal, &stakedUsers)

	usersFile, _ := os.Open("users.json")
	byteVal, _ := ioutil.ReadAll(usersFile)

	var users Users

	json.Unmarshal(byteVal, &users)

	//totalHippos := len(stakedUsers)
	totalPoints := 0
	for _, user := range users.Users {
		totalPoints += user.Points
	}

	var staked_amount []int
	totalHippos := 0

	for i, user := range users.Users {
		staked_amount = append(staked_amount, 0)
		for _, staked := range stakedUsers {
			if user.PubKey == staked.Owner {
				staked_amount[i] += 1
				totalHippos += 1
			}
		}
	}

	log.Println("tot_hippos", totalHippos)

	funds := getAvailableFunds()
	for i, user := range users.Users {
		if user.Points > 0 {
			share := (float64(staked_amount[i]) + float64(user.Points)) / (float64(totalPoints) + float64(totalHippos))

			log.Println("staked", staked_amount[i], "share", share, "funds", funds)

			users.Users[i].Claim = int(math.Floor(float64(funds) * share))
		} else {
			users.Users[i].Claim = 0
		}
	}

	output, _ := json.Marshal(users)
	ioutil.WriteFile("users.json", output, os.ModePerm)
}

func getAvailableFunds() int {
	c := client.NewClient(rpc.MainnetRPCEndpoint)

	balance, err := c.GetBalance(
		context.Background(),
		"ovr1Dbk9Jw25LV3vJTcvuMso87jEeZzMB66GGygrEFH", // playfee wallet
	)
	if err != nil {
		log.Fatalln("get balance error", err)
	}

	return int(math.Floor(float64(balance) * 0.7))
}

func resetPoints() {
	usersFile, _ := os.Open("users.json")
	byteVal, _ := ioutil.ReadAll(usersFile)

	var users Users

	json.Unmarshal(byteVal, &users)

	for i, _ := range users.Users {
		users.Users[i].Points = 0
		users.Users[i].Claim = 0
	}

	output, _ := json.Marshal(users)
	ioutil.WriteFile("users.json", output, os.ModePerm)
}

func updatePoints(like_ids []string, comment_ids []string) {

	usersFile, _ := os.Open("users.json")
	byteVal, _ := ioutil.ReadAll(usersFile)

	//log.Println(string([]byte(byteVal)))

	var users Users

	json.Unmarshal(byteVal, &users)

	for i, user := range users.Users {
		for _, id := range like_ids {
			if user.TwitterId == id {
				users.Users[i].Points += 2
				log.Println("found like")
			}
		}
		for _, id := range comment_ids {
			if user.TwitterId == id {
				users.Users[i].Points += 1
				log.Println("found comment")
			}
		}
	}

	log.Println(users)

	output, _ := json.Marshal(users)
	ioutil.WriteFile("users.json", output, os.ModePerm)
}

func GetTweets() []string {
	start_time := time.Now().Add(-time.Hour * 168).Format(time.RFC3339)[0:19] + "Z"
	//start_time := "2010-11-06T00:00:00Z"
	fmt.Println(start_time[0:19])

	url := "https://api.twitter.com/2/users/1469839376129658882/tweets?exclude=retweets&start_time=" + start_time

	fmt.Println(url)

	// Create a new request using http
	req, err := http.NewRequest("GET", url, nil)

	// add authorization header to the req
	req.Header.Add("Authorization", bearer)

	// Send req using http Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error on response.\n[ERROR] -", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)

	var m map[string]interface{}
	var w http.ResponseWriter
	if err != nil {
		log.Println("Error while reading the response bytes:", err)
	}
	if err = json.Unmarshal(body, &m); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return nil
	}

	//t := fmt.Sprintf("%T", m["data"])

	//log.Println(string([]byte(body)))

	var id []string

	log.Println("r_c", reflect.TypeOf(m["meta"].(map[string]interface{})["result_count"]))

	if m["meta"].(map[string]interface{})["result_count"] == float64(0) {
		return id
	}

	for i := range m["data"].([]interface{}) {
		str_id := fmt.Sprintf("%v", m["data"].([]interface{})[i].(map[string]interface{})["id"])
		id = append(id, str_id)
	}

	return id

	//log.Println(m["data"].([]interface{})[0].(map[string]interface{})["id"]) //.([]Tweet))
}

func GetTwitterLikes(id string) []string {
	url := "https://api.twitter.com/2/tweets/" + id + "/liking_users"

	// Create a new request using http
	req, err := http.NewRequest("GET", url, nil)

	// add authorization header to the req
	req.Header.Add("Authorization", bearer)

	// Send req using http Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error on response.\n[ERROR] -", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	var m map[string]interface{}
	var w http.ResponseWriter
	if err != nil {
		log.Println("Error while reading the response bytes:", err)
	}

	//log.Println(string([]byte(body)))

	if err = json.Unmarshal(body, &m); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return nil
	}

	log.Println(m["data"].([]interface{})[0].(map[string]interface{}))

	var ids []string

	if m["meta"].(map[string]interface{})["result_count"] == float64(0) {
		return ids
	}

	for i := range m["data"].([]interface{}) {
		str_id := fmt.Sprintf("%v", m["data"].([]interface{})[i].(map[string]interface{})["id"])
		ids = append(ids, str_id)
	}

	log.Println(ids)
	return ids
}

func GetTwitterComments(id string) []string {
	url := "https://api.twitter.com/2/tweets/search/recent?query=conversation_id:" + id + "&tweet.fields=in_reply_to_user_id,author_id,created_at,conversation_id"

	//url := "https://api.twitter.com/2/tweets?ids=1612288823245025283&tweet.fields=author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets&expansions=author_id,in_reply_to_user_id,referenced_tweets.id"

	// Create a new request using http
	req, err := http.NewRequest("GET", url, nil)

	// add authorization header to the req
	req.Header.Add("Authorization", bearer)

	// Send req using http Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error on response.\n[ERROR] -", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	var m map[string]interface{}
	var w http.ResponseWriter
	if err != nil {
		log.Println("Error while reading the response bytes:", err)
	}
	if err = json.Unmarshal(body, &m); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return nil
	}

	var ids []string

	if m["meta"].(map[string]interface{})["result_count"] == float64(0) {
		return ids
	}

	for i := range m["data"].([]interface{}) {
		str_id := fmt.Sprintf("%v", m["data"].([]interface{})[i].(map[string]interface{})["author_id"])
		ids = append(ids, str_id)
	}

	log.Println(ids)

	return ids
}

func main() {
	tweets := GetTweets()
	resetPoints()
	for _, tweet := range tweets {
		//GetTwitterComments(tweet)
		updatePoints(GetTwitterLikes(tweet), GetTwitterComments(tweet))
	}
	updateClaim()
}
