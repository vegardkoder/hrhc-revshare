/*
MESSAGE PROTOCOL

-keyword -info

keywords:
deposit,txId

*/
package main

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Message struct {
	Message string `json:"message"`
}

var upgrader = websocket.Upgrader{}

func checkIfStaking() {
	cmd := exec.Command(`E:\hrhc-revshare\backend\stake\run.bat`)
	stdout, err := cmd.Output()
	log.Println("std", stdout, "err", err)

	stakeUsers, _ := os.Open(`E:\hrhc-revshare\backend\stake\stakedAccounts.json`)

	log.Println(stakeUsers)
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

func main() {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/ws", func(c echo.Context) error {
		upgrader.CheckOrigin = func(r *http.Request) bool { return true }

		ws, err := upgrader.Upgrade(c.Response().Writer, c.Request(), nil)
		if !errors.Is(err, nil) {
			log.Println(err)
		}
		defer ws.Close()

		log.Println("Connected!")

		for {
			var message Message
			var returnValue string
			returnValue = ""
			log.Println(returnValue)

			err := ws.ReadJSON(&message)
			if !errors.Is(err, nil) {
				log.Printf("error occured: %v", err)
				break
			}
			log.Println(message)

			protocol := strings.Split(message.Message, ",")
			keyword := protocol[0]
			pubKey := protocol[1]

			log.Println(keyword)

			//pulling the latest users
			usersFile, _ := os.Open("users.json")
			byteVal, _ := ioutil.ReadAll(usersFile)
			var users Users
			json.Unmarshal(byteVal, &users)

			if keyword == "CONNECTED" {

				log.Println(pubKey)

				for _, user := range users.Users {
					if user.PubKey == pubKey {
						log.Println("user exists")
						returnValue = "TWITTER_ID," + user.TwitterId + ",CLAIM," + strconv.Itoa(user.Claim)
						break
					}
				}
				if returnValue == "" {
					log.Println("creating new user")
					newUser := User{PubKey: pubKey, TwitterId: "", Points: 0}
					users.Users = append(users.Users, newUser)
					returnValue = "CREATED USER"
				}

			} else if keyword == "TWITTER" {

				twitterId := protocol[2]

				for _, user := range users.Users {
					if user.TwitterId == twitterId {
						returnValue = "TAKEN"
					}
				}

				if returnValue == "" {
					for i, user := range users.Users {
						if user.PubKey == pubKey {
							users.Users[i].TwitterId = twitterId
							returnValue = "TWITTER_ID," + user.TwitterId + ",CLAIM," + strconv.Itoa(user.Claim)
							break
						}
					}
				}
				if returnValue == "" {
					returnValue = "didn't find current user"
				}

			} else if keyword == "CLAIM" {
				for i, user := range users.Users {
					if user.PubKey == pubKey {
						//
						// *** make payout ***
						//

						users.Users[i].Claim = 0
						returnValue = "CLAIMED SOL"
						break
					}
				}
				if returnValue == "" {
					returnValue = "didn't find current user"
				}

				log.Println(pubKey)
			}

			updated, _ := json.Marshal(users)
			ioutil.WriteFile("users.json", updated, os.ModePerm)

			log.Println(returnValue)

			if err := ws.WriteJSON(returnValue); !errors.Is(err, nil) { //write back to frontend
				log.Printf("error occured: %v", err)
			}
		}

		return nil
	})
	e.Logger.Fatal(e.Start(":8080"))
}
