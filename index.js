const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.env.TOKEN;
const fs = require('fs');
client.sD = require('./scheduleData.json');
const prefix = "/S";

function datify(stringDate, stringTime, creation) {
  let splitDate = stringDate.split("/")
  let splitHour = stringTime.split(":")
  let now = new Date();
  let date = new Date(parseInt(now.getFullYear()),parseInt(splitDate[1])-1,parseInt(splitDate[0]),parseInt(splitHour[0]),parseInt(splitHour[1]))
  if (date.getTime() < Date.now() - 1000*3600*25)
    date.setYear(now.getFullYear()+1)
  return date
}

function dateDisplay(date, precision) {
  switch (precision) {
    case true:
      return date.getDate() + "/" + (date.getMonth() + 1) + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
      break;
    case false:
      return date.getDate() + "/" + (date.getMonth() + 1)
      break;
  }
}

function ping(members, message) {
  if(members.length > 0) {
    for(let i = 0; i < members.length; i++) {
      client.users.cache.get(members[i].replace(/(<@|>)/gi, "")).send(message)
    }
  }
}

function initiateChecker() {
  for(let guild in client.sD) {
    if(client.sD[guild]) {
      setInterval(function() {
        let dateNow = new Date()
        let date = Date.now()
        // + parseInt(dateNow.toString().match(/\+\d{4}/gi)[0])*36000
        for (let p in client.sD[guild]["Parties"]) {
          if (p != "List") {
            var game = client.sD[guild]["Parties"][p];
            var current = datify(game.Date, game.specs.Heure);
            
            if(!game.ping2 && current.getTime() < date && !(current.getTime() < date - 1000*1200)) {
              console.log("ping2")
              game.ping2 = true
              ping(game.specs.Joueurs, "La partie **" + p + "** vient de commencer!")
              ping([game.specs.MJ], "La partie **" + p + "** vient de commencer!")
              
            } else if(current.getTime() < date + 1000*3600 && !game.ping1 && !game.ping2) {
              console.log("ping1")
              game.ping1 = true
              ping(game.specs.Joueurs, "La partie **" + p + "** va commencer à " + game.specs.Heure)
              ping([game.specs.MJ], "La partie **" + p + "** va commencer à " + game.specs.Heure)
              
            } else if(current.getTime() < date - 1000*3600*24) {
              console.log("deleted " + p)
              client.sD[guild]["Parties"].List.splice(client.sD[guild]["Parties"].List.indexOf(p), 1);
              if(client.sD[guild]["assigned"]) {
                  client.channels.cache.get(client.sD[guild]["assigned"]).messages.fetch(client.sD[guild]["Parties"][p]["state"])
                    .then(messagea => {messagea.delete();})
                    .catch(err => console.warn(err))
              }
              
              delete client.sD[guild]["Parties"][p];
            }
            
            fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
              if(err) {throw err;}
            })
          }
        }
      }, 1000*10)
    }
  }
}

client.on('ready', () => {
  console.log("Salut, moussaillon. " + Math.random())
  
  initiateChecker();
})

client.on('message', (message) => {
  if (message.content.toUpperCase().startsWith(prefix)) {
    if (client.sD[message.guild.id] && message.content != "/s init"){
      
      let raison = "";
      if (message.content.match(/( ").*"$/gi)) {raison = message.content.match(/( ").*"$/gi)[0];}
      
      ask(message.content.slice(3).replace(raison, ""), message, raison)
      
    } 
    else if (message.content.toUpperCase() == "/S INIT") {
      
      if (!message.member.hasPermission("ADMINISTRATOR")) {
        message.channel.send("Vous n'avez pas les permissions pour utiliser cette commande.")
        return
      }
      
      client.sD[message.guild.id] = {"Parties": {"List": []}}

      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("le bot est maintenant réinitialisé sur ce serveur, les commandes sont disponibles. tappez /s assign <salon> pour assigner un salon automatique");
      })
      
    } 
    else {
      message.channel.send("Vous devez initier le bot sur ce serveur avec /s init")
    }
      
  }
})

client.login(token)

function ask(command, message, raison) {
    
  if (command.slice(6).toUpperCase().startsWith("ADD")) {
    
    let gameName = command.slice(10).replace(/( specs).*/gi, "")
    let gameDate = command.replace(/( add).*/gi, "")
    
    if (!command.match(/(\S;|;\S)/gi)) {
      
      let gameContent = command.slice(10).replace(/.*( specs )/gi, "").split(" ; ");
      
      if (gameContent.length != 6) {
        message.channel.send("Tonnerre de Zeus! Pas le bon nombre d'arguments.")
        return
      }
      if (client.sD[message.guild.id].Parties[gameName]) {
        message.channel.send("Mille sabords! Cette partie existe déjà.")
        return
      }
      if (gameContent[4].length > 1000) {
        message.channel.send("Moussaillon, vous ecrivez trop! Le synopsis ne doit pas dépasser 1000 caractères.")
        return
      }
      if (gameName.length > 40) {
        message.channel.send("Moussaillon, vous ecrivez trop! Le nom de partie ne doit pas dépasser 40 caractères.")
        return
      }
      if (gameContent[0].length > 40) {
        console.log(gameContent[0])
        message.channel.send("Moussaillon, vous ecrivez trop! Le nom du Jeu ne doit pas dépasser 40 caractères.")
        return
      }
      if (gameContent[1].length > 40) {
        message.channel.send("Moussaillon, vous ecrivez trop! Le style ne doit pas dépasser 40 caractères.")
        return
      }
      if (!gameContent[3].match(/(<@|>)/gi) || gameContent[3].match(/(<@|>)/gi).length > 2) {
        message.channel.send("Désolé, mais il est nécessaire que le MJ soit du format d'une @Mention et qu'il soit unique")
        return
      }
      if (!gameContent[2].match(/\d{2}:\d{2}/gi) || gameContent[2].match(/\d{2}:\d{2}/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que l'heure soit du format HH:MM et qu'il n'y en ai qu'une")
        return
      }
      if (!gameDate.match(/\d{2}\/\d{2}/gi) || gameDate.match(/\d{2}\/\d{2}/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que la date soit du format JJ/MM et qu'il n'y en ai qu'une")
        return
      }
      if (!gameContent[5].match(/\d+$/gi) || gameContent[5].match(/\d+$/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que le nombre de places soit un nombre et qu'il n'y en ai qu'un")
        return
      }
      
      let request = {
        "Auteur": message.author,
        "Date": gameDate,
        "ping1": false,
        "ping2": false,
        "specs": {
          "Jeu": gameContent[0],
          "Style": gameContent[1],
          "Heure": gameContent[2],
          "MJ": gameContent[3].replace("!", ""),
          "Synopsis": gameContent[4],
          "Places": gameContent[5],
          "Joueurs": [],
          "Attente": []
        }
      }
      
      
      client.sD[message.guild.id]["Parties"][gameName] = request;
      client.sD[message.guild.id]["Parties"].List.splice(sortDates(datify(gameDate, gameContent[2])), 0, gameName);
      
      sendAssigned(message, gameName, false)
      
      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
      if(err) {throw err;}
        
        message.channel.send("Ajout réussi de la partie **" + gameName + "** dans l'agenda, pour le " + gameDate + " à " + gameContent[2] + "!");
      })
        
    } else {
      message.channel.send("Kartofen! La syntaxe est précise, les \";\" doivent être entourés d'espaces: \" ; \"...");
    }
  }

  if (command.slice(6).toUpperCase().startsWith("NEXT") && testForExist(command.slice(11).replace(/( =>).*$/gi, ""))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(11).replace(/( =>).*$/gi, "")];
    
    if(("<@" + message.member.user.id + ">" == p.specs.MJ || message.author == p.Auteur)) {
      
      let gameContent = command.replace(/^.*( specs )/gi, "").split(" ; ")
      
      if (gameContent.length != 2) {
        message.channel.send("Tonnerre de Zeus! Pas le bon nombre d'arguments.")
        return
      }
      if (client.sD[message.guild.id].Parties[command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", "")]) {
        message.channel.send("Mille sabords! Cette partie existe déjà.")
        return
      }
      if (gameContent[1].length > 1000) {
        message.channel.send("Moussaillon, vous ecrivez trop! Le synopsis ne doit pas dépasser 1000 caractères.")
        return
      }
      if (command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", "").length > 40) {
        message.channel.send("Moussaillon, vous ecrivez trop! Le nom de partie ne doit pas dépasser 40 caractères.")
        return
      }
      if (!gameContent[0].match(/\d{2}:\d{2}/gi) || gameContent[2].match(/\d{2}:\d{2}/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que l'heure soit du format HH:MM et qu'il n'y en ai qu'une")
        return
      }
      if (!command.match(/\d{2}\/\d{2}/gi) || command.match(/\d{2}\/\d{2}/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que la date soit du format JJ/MM et qu'il n'y en ai qu'une")
        return
      }
      
      let request = {
        "Auteur": p.Auteur,
        "Date": command.match(/\d{2}\/\d{2}/gi)[0],
        "ping1": false,
        "ping2": false,
        "specs": {
          "Jeu": p.specs.Jeu,
          "Style": p.specs.Style,
          "Heure": gameContent[0],
          "MJ": p.specs.MJ,
          "Synopsis": gameContent[1],
          "Places": p.specs.Places,
          "Joueurs": p.specs.Joueurs,
          "Attente": []
        }
      }
      
      client.sD[message.guild.id]["Parties"][command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", "")] = request;
      client.sD[message.guild.id]["Parties"].List.splice(sortDates(datify(request.Date, request.specs.Heure)), 0, command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", ""));
      
      ping(request.specs.Joueurs, "À tous les joueurs de la partie **" + command.slice(11).replace(/( =>).*$/gi, "") + "**, celle-ci prendra sa suite le " + request.Date + " à " + request.specs.Heure + ", sous le nom de " + command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", ""))
      if("<@" + message.member.user.id + ">" != p.specs.MJ) {ping([p.specs.MJ], "Votre partie **" + command.slice(11).replace(/( =>).*$/gi, "")+ "**a été reportée au " + p.Date + " à " + p.specs.Heure + ". " + raison)}
      
      sendAssigned(message, command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", ""), false)
      
      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("La suite **"+ command.match(/(=>).*( specs)/gi)[0].replace("=> ", "").replace(" specs", "") + "** a été ajoutée avec succès au " + p.Date + " à "+ p.specs.Heure +".");
      })
      
    } else {
      message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.")
    }
  }
  
  if (command.length < 1) {
    
    let format = new Discord.MessageEmbed()
      .setColor("#ffff00")
      .setTitle("Résultat(s) de la recherche")
      .setDescription("Vous trouverez ci-dessous l'agenda de toutes les parties postées par les membres de ce serveur. Attention, seul les 25 premiers résultats sont affichés ici.")
    let p = client.sD[message.guild.id]["Parties"]
    
    //<JJ/MM> <HH:MM>: Partie:<Partie> Jeu:<Jeu> Style:<Style> MJ:<MJ> --- <Place Libres>/<Places>
    for (let i = 0; i < p.List.length; i++) {
      format.addField(p[p.List[i]].Date + " " + p[p.List[i]].specs.Heure, 
                      "__Partie:__ " + p.List[i] +
                      " __Jeu:__ " + p[p.List[i]].specs.Jeu +
                      " __Style:__ " + p[p.List[i]].specs.Style +
                      " __MJ:__ " + p[p.List[i]].specs.MJ +
                      " __Statut:__ " + (p[p.List[i]].specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1 ? "Joueur" : p[p.List[i]].specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1 ? "Attente" : p[p.List[i]].specs.MJ == "<@" + message.member.user.id + ">" ? "MJ" : "-") +
                      " --- " + p[p.List[i]].specs.Joueurs.length + "/" + p[p.List[i]].specs.Places +
                      "", false)
    }
    format.setTitle("Résultat(s) de la recherche ("+ p.List.length +" partie(s) correspondant)")
    
    if (p.List.length < 1) {format.addField("Aucune partie pour le moment", "*-*")}
    
    message.channel.send(format);
  }
  
  if (command.match(/\d{2}\/\d{2}$/gmi) || command.match(/\d{2}\/\d{2}( ex)$/gmi) || command.startsWith("<@") || command.startsWith("Jeu: ")) {
    
    let p = client.sD[message.guild.id]["Parties"]
    let valid = 0;
    
    let format = new Discord.MessageEmbed()
      .setColor("#ffff00")
      .setTitle("Résultat(s) de la recherche")
      .setDescription("Vous trouverez ci-dessous l'agenda de toutes les parties postées par les membres de ce serveur. Attention, seul les 25 premiers résultats sont affichés ici. Recherche par " + (command.startsWith("Jeu ") ? "Jeu: " + command.replace("Jeu ", "") : command.startsWith("<@") ? "MJ: " + command : "Date: " + command.replace(" ex", "")))
    
    for (let i = 0; i < (p.List.length); i++) {
      if(command.startsWith("Jeu: ") ? true : command.startsWith("<@") ? true : datify(p[p.List[i]].Date , p[p.List[i]].specs.Heure) > datify(command.match(/\d{2}\/\d{2}/gmi)[0], "00:00")) {
        if(command.startsWith("Jeu: ") ? true : command.startsWith("<@") ? true : datify(p[p.List[i]].Date , p[p.List[i]].specs.Heure) < datify(command.match(/\d{2}\/\d{2}/gmi)[0], "23:59") && command.match(/( ex)/gi) || !command.match(/( ex)/gi))  {
          if(command.startsWith("Jeu: ") ? true : command.startsWith("<@") ? p[p.List[i]].specs.MJ == command.replace("!", "") : true) {
            if(command.startsWith("Jeu: ") ? p[p.List[i]].specs.Jeu == command.replace("Jeu: ", "") : true) {
              if(i < 25) {
                format.addField(p[p.List[i]].Date + " " + p[p.List[i]].specs.Heure, 
                              "__Partie:__ " + p.List[i] +
                              " __Jeu:__ " + p[p.List[i]].specs.Jeu +
                              " __Style:__ " + p[p.List[i]].specs.Style +
                              " __MJ:__ " + p[p.List[i]].specs.MJ +
                              " __Statut:__ " + (p[p.List[i]].specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1 ? "Joueur" : p[p.List[i]].specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1 ? "Attente" : p[p.List[i]].specs.MJ == "<@" + message.member.user.id + ">" ? "MJ" : "-") +
                              " --- " + p[p.List[i]].specs.Joueurs.length + "/" + p[p.List[i]].specs.Places +
                              "", false)
              }
              valid++;
            }
          }
        }
      }
    }
    
    format.setTitle("Résultat(s) de la recherche ("+ valid +" partie(s) correspondant)")
    
    if (valid < 1) {format.addField("Aucune partie correspondant", "*-*")}
    
    message.channel.send(format);
  }
  
  if (client.sD[message.guild.id]["Parties"][command]) { 
    
    if (!testForExist(command)) return
    
    message.channel.send(gameDetails(command));
  }
  
  if (command.toUpperCase().startsWith("P") && testForExist(command.slice(2))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(2)]
    if (p.specs.Joueurs.indexOf("<@" + message.member.user.id + ">") < 0 && p.specs.Attente.indexOf("<@" + message.member.user.id + ">") < 0) {
      
      if (p.specs.Joueurs.length < parseInt(p.specs.Places)){
        p.specs.Joueurs.push("<@" + message.member.user.id + ">")

        sendAssigned(message, command.slice(2), true)

        fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
          if(err) {throw err;}
          message.channel.send("Participation à la partie **" + command.slice(2) + "** enregistrée ! tappez /s me pour avoir la liste de vos engagements.");
        })

        if (p.specs.Joueurs.length == parseInt(p.specs.Places))
          ping([p.specs.MJ], "La partie **" + command.slice(2) + "** est maintenant pleine.")

      } else {
        p.specs.Attente.push("<@" + message.member.user.id + ">")

        sendAssigned(message, command.slice(2), true)

        fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
          if(err) {throw err;}
          message.channel.send("Désolé, la partie **" + command.slice(2) + "** est pleine, nous attendons un desistement pour vous y faire entrer!");
        })
      }
    } else {
      message.channel.send("Désolé, mais on ne vous engagera pas deux fois.")
    }
  }
  
  if (command.toUpperCase().startsWith("QUIT") && testForExist(command.slice(5))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(5)]
    if (p.specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1 || p.specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1) {
      

      if (p.specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1) {
        p.specs.Joueurs.splice(p.specs.Joueurs.indexOf("<@" + message.member.user.id + ">"), 1)

        if (p.specs.Attente.Length > 0) {
          p.specs.Joueurs.push(p.specs.Attente[0])
          ping([p.specs.Attente[0]], "Une place s'est libérée dans la partie **" + command.slice(5) + "**. Vous avez été ajouté à la liste de joueurs. Si vous avez un empêchement, merci de quitter la partie sur le serveur.")
          p.specs.Attente.splice(0,1)
        }

        ping([p.specs.MJ], "<@" + message.member.user.id + ">" + " a quitté la partie **" + command.slice(5) + "**.")

      }
      if (p.specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1) {p.specs.Attente.splice(p.specs.Attente.indexOf("<@" + message.member.user.id + ">"), 1)}

      sendAssigned(message, command.slice(5), true)

      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("Participation à la partie **" + command.slice(5) + "** annulée ! tappez /s me pour avoir la liste de vos engagements.");
      })
    } else {
      message.channel.send("Vous n'allez pas nous quitter sans être venu tout de même...")
    }
  }
  
  if (command.toUpperCase() == "ME") {
    let p = client.sD[message.guild.id]["Parties"]
    let validJ = 0;
    let validA = 0;
    let validM = 0;


    
    let format = new Discord.MessageEmbed()
      .setColor("#ffff00")
      .setTitle("Résultat(s) de la recherche")
      .setDescription("Vous trouverez ci-dessous l'agenda de toutes les parties postées par les membres de ce serveur que vous menez ou auxquelles vous participez.")
      .addField("Parties en tant que", "**Joueur**", false)
    
    for (let i = 0; i < p.List.length; i++) {
      if(p[p.List[i]].specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1) {
        format.addField(p[p.List[i]].Date + " " + p[p.List[i]].specs.Heure, 
                        "__Partie:__ " + p.List[i] +
                        " __Jeu:__ " + p[p.List[i]].specs.Jeu +
                        " __Style:__ " + p[p.List[i]].specs.Style +
                        " __MJ:__ " + p[p.List[i]].specs.MJ +
                        " __Statut:__ " + (p[p.List[i]].specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1 ? "Joueur" : p[p.List[i]].specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1 ? "Attente" : p[p.List[i]].specs.MJ == "<@" + message.member.user.id + ">" ? "MJ" : "-") +
                        " --- " + p[p.List[i]].specs.Joueurs.length + "/" + p[p.List[i]].specs.Places +
                        "", false)
        validJ++;
      }
    }
    
    if (validJ < 1) {format.addField("Aucune partie correspondant", "*-*")}
    
    format.addField("Parties en tant que", "**Attente**", false)
    for (let i = 0; i < p.List.length; i++) {
      if(p[p.List[i]].specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1) {
        format.addField(p[p.List[i]].Date + " " + p[p.List[i]].specs.Heure, 
                        "__Partie:__ " + p.List[i] +
                        " __Jeu:__ " + p[p.List[i]].specs.Jeu +
                        " __Style:__ " + p[p.List[i]].specs.Style +
                        " __MJ:__ " + p[p.List[i]].specs.MJ +
                        " __Statut:__ " + (p[p.List[i]].specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1 ? "Joueur" : p[p.List[i]].specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1 ? "Attente" : p[p.List[i]].specs.MJ == "<@" + message.member.user.id + ">" ? "MJ" : "-") +
                        " --- " + p[p.List[i]].specs.Joueurs.length + "/" + p[p.List[i]].specs.Places +
                        "", false)
        validA++;
      }
    }
    
    if (validA < 1) {format.addField("Aucune partie correspondant", "*-*")}
    
    format.addField("Parties en tant que", "**MJ**", false)
    for (let i = 0; i < p.List.length; i++) {
      if(p[p.List[i]].specs.MJ == "<@" + message.member.user.id + ">") {
        format.addField(p[p.List[i]].Date + " " + p[p.List[i]].specs.Heure, 
                        "__Partie:__ " + p.List[i] +
                        " __Jeu:__ " + p[p.List[i]].specs.Jeu +
                        " __Style:__ " + p[p.List[i]].specs.Style +
                        " __MJ:__ " + p[p.List[i]].specs.MJ +
                        " __Statut:__ " + (p[p.List[i]].specs.Joueurs.indexOf("<@" + message.member.user.id + ">") > -1 ? "Joueur" : p[p.List[i]].specs.Attente.indexOf("<@" + message.member.user.id + ">") > -1 ? "Attente" : p[p.List[i]].specs.MJ == "<@" + message.member.user.id + ">" ? "MJ" : "-") +
                        " --- " + p[p.List[i]].specs.Joueurs.length + "/" + p[p.List[i]].specs.Places +
                        "", false)
        validM++;
      }
    }
    
    if (validM < 1) {format.addField("Aucune partie correspondant", "*-*")}
    
    message.channel.send(format);
  }
  
  if (command.toUpperCase().startsWith("RM") && testForExist(command.slice(3))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(3)];
    
    if(message.member.roles.cache.some(role => role.name === 'Modérateur') || message.member.hasPermission("ADMINISTRATOR") || "<@" + message.member.user.id + ">" == p.specs.MJ || message.author == p.Auteur) {
      
      if(client.sD[message.guild.id]["assigned"]) {
        client.channels.cache.get(client.sD[message.guild.id]["assigned"]).messages.fetch(p["state"])
          .then(messagea => {messagea.delete();})
          .catch(err => console.warn(err))
      }
      
      client.sD[message.guild.id]["Parties"].List.splice(client.sD[message.guild.id]["Parties"].List.indexOf(command.slice(3)), 1);
      delete client.sD[message.guild.id]["Parties"][command.slice(3)];
      
      if (datify(p.Date, p.specs.Heure).getTime() > Date.now()) {
        ping(p.specs.Joueurs, "À tous les joueurs de la partie **" + command.slice(3) + "**, celle-ci a été annulée. " + raison)
        if("<@" + message.member.user.id + ">" != p.specs.MJ) {ping([p.specs.MJ], "Votre partie **" + command.slice(3) + "**a été annulée. " + raison)}
      }
        
      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("La partie **"+ command.slice(3) + "** a été supprimée avec succès.");
      })
      
    } else {
      message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.")
    }
  }
  
  if (command.toUpperCase().startsWith("DEC") && testForExist(command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, ""))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, "")];
    
    if(message.member.roles.cache.some(role => role.name === 'Modérateur') || message.member.hasPermission("ADMINISTRATOR") || "<@" + message.member.user.id + ">" == p.specs.MJ || message.author == p.Auteur) {
      
      if (!command.match(/\d{2}:\d{2}/gi) || command.match(/\d{2}:\d{2}/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que l'heure soit du format HH:MM et qu'il n'y en ai qu'une")
        return
      }
      if (!command.match(/\d{2}\/\d{2}/gi) || command.match(/\d{2}\/\d{2}/gi).length > 1) {
        message.channel.send("Désolé, mais il est nécessaire que la date soit du format JJ/MM et qu'il n'y en ai qu'une")
        return
      }
      
      p.Date = command.match(/\d{2}\/\d{2}/gi)[0]
      p.specs.Heure = command.match(/\d{2}:\d{2}/gi)[0]
      p.ping1 = false
      p.ping2 = false
      
      client.sD[message.guild.id]["Parties"].List.splice(client.sD[message.guild.id]["Parties"].List.indexOf(command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, "")), 1);
      client.sD[message.guild.id]["Parties"].List.splice(sortDates(datify(p.Date, p.specs.Heure)), 0, command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, ""));
      
      ping(p.specs.Joueurs, "À tous les joueurs de la partie **" + command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, "") + "** a été reportée au " + p.Date + " à " + p.specs.Heure + ". " + raison)
      if("<@" + message.member.user.id + ">" != p.specs.MJ) {ping([p.specs.MJ], "Votre partie **" + command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, "") + "**a été reportée au " + p.Date + " à " + p.specs.Heure + ". " + raison)}
      
      sendAssigned(message, command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, ""), true)
      
      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("La partie **"+ command.slice(4).replace(/\s\d{2}(\/|:)\d{2}/gi, "") + "** a été décalée avec succès au " + p.Date + " à "+ p.specs.Heure +".");
      })
      
    } else {
      message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.")
    }
  }  
  
  if (command.toUpperCase().startsWith("MOD") && testForExist(command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, ""))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, "")];
    
    if(message.member.roles.cache.some(role => role.name === 'Modérateur') || message.member.hasPermission("ADMINISTRATOR") || "<@" + message.member.user.id + ">" == p.specs.MJ || message.author == p.Auteur) {
      
      if (!command.slice(4).match(/(( Jeu ; )|( Style ; )|( Synopsis ; )|( MJ ; ))/gi) || command.slice(4).match(/(( Jeu ; )|( Style ; )|( Synopsis ; )|( MJ ; ))/gi).length > 1) {
        message.channel.send("Désolé, mais la syntaxe n'est pas respectée tappez /s help pour l'avoir.")
        return
      }
      
      let variable = command.slice(4).match(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi)[0].slice(1).split(" ; ")
      
      p.specs[variable[0]] = command.match(/( MJ)/gi) ? variable[1].replace("!", "") : variable[1];
      
      ping(p.specs.Joueurs, "À tous les joueurs de la partie **" + command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, "") + "** a été modifiée, tappez /s " + command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, "") + " pour plus d'informations. " + raison)
      if("<@" + message.member.user.id + ">" != p.specs.MJ) {ping([p.specs.MJ], "Votre partie **" + command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, "") + "** a été modifiée, tappez /s " + command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, "") + " pour plus d'informations. " + raison)}
      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("La partie **"+ command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, "") + "** a été modifiée avec succès.");
      })
      
      sendAssigned(message, command.slice(4).replace(/(( Jeu)|( Style)|( Synopsis)|( MJ)).*/gi, ""), true)
      
    } else {
      message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.")
    }
  } 
  
  if (command.toUpperCase().startsWith("KICK") && testForExist(command.slice(5).replace(/\s<@\S*>/gi, ""))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(5).replace(/\s<@\S*>/gi, "")];
    
    if(message.member.roles.cache.some(role => role.name === 'Modérateur') || message.member.hasPermission("ADMINISTRATOR") || "<@" + message.member.user.id + ">" == p.specs.MJ || message.author == p.Auteur) {
      
      let target = command.match(/<@\S*>/gi)[0]
      
      if(p.specs.Attente.indexOf(target) < 0 && p.specs.Joueurs.indexOf(target) < 0) {
        message.channel.send("Ce joueur ne participe pas à la partie.")
        return
      }
      
      if(p.specs.Attente.indexOf(target) > -1) {console.log("A"); p.specs.Attente.splice(p.specs.Attente.indexOf(target), 1)}
      if(p.specs.Joueurs.indexOf(target) > -1) {console.log("J"); p.specs.Joueurs.splice(p.specs.Joueurs.indexOf(target), 1)}

      if (p.specs.Attente.Length > 0) {
        p.specs.Joueurs.push(p.specs.Attente[0])
        ping([p.specs.Attente[0]], "Une place s'est libérée dans la partie **" + command.slice(5) + "**. Vous avez été ajouté à la liste de joueurs. Si vous avez un empêchement, merci de quitter la partie sur le serveur.")
        p.specs.Attente.splice(0,1)
      }

      ping([target], "Vous avez été rejeté de la partie **" + command.slice(5) + "** par un modérateur. " + raison)

      fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("Le joueur "+ target + " a été supprimé avec succès de la partie **" + command.slice(5).replace(/\s<@\S*>/gi, "") + "**.");
      })
      
    } else {
      message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.")
    }
  } 
  
  if (command.toUpperCase().startsWith("PING") && testForExist(command.slice(5))) {
    
    let p = client.sD[message.guild.id]["Parties"][command.slice(5)];
    
    if(message.member.roles.cache.some(role => role.name === 'Modérateur') || message.member.hasPermission("ADMINISTRATOR") || "<@" + message.member.user.id + ">" == p.specs.MJ || message.author == p.Auteur) {
      
      ping(p.specs.Joueurs, "À tous les joueurs de la partie **" + command.slice(5) + "**, de la part de <@" + message.member.user.id + "> : " + raison)
      
    } else {
      message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.")
    }
  }
  
  if (command.toUpperCase().startsWith("ASSIGN") && message.member.hasPermission("ADMINISTRATOR")) {
    
    if(!command.match(/(<#|>)/gi) || command.match(/(<#|>)/gi).length > 2) {
      message.channel.send("Désolé, mais le salon assigné doit être une #mention, ou vous avez mentionné trop de salons.")
      return
    }
    
    client.sD[message.guild.id]["assigned"] = command.slice(7).replace(/(<#|>)/gi, "")
    
    fs.writeFile("./scheduleData.json", JSON.stringify (client.sD, null, 4), err => {
        if(err) {throw err;}
        message.channel.send("le bot est maintenant assigné au salon " + command.slice(7));
    })
  }
  
  if (command.toUpperCase() == ("HELP")) {
    
    let format = new Discord.MessageEmbed()
      .setColor("#ffff00")
      .setTitle("Répertoire de commandes /s")
      .addField("**/s <JJ/MM> add <Partie> specs <Jeu> ; <Style> ; <HH:MM> ; <MJ> ; <Synopsis> ; <Places>**", "> ajout une partie à l'agenda")
      .addField("**/s <JJ/MM> next <Partie> => <Suite> specs <HH:MM> ; <Nouveau Synopsis>**", "> prévoit la suite d'une partie déjà existante")
      .addField("**/s **", "> envoie la liste des parties à partir de la date d'envoi du message")
      .addField("**/s <JJ/MM> (ex)**", "> envoie la liste des parties à partir de la date spécifiée, si \"ex\" alors uniquement du jour spécifié")
      .addField("**/s <MJ>**", "> envoie les dates pour le MJ spécifié")
      .addField("**/s Jeu: <Jeu>**", "> envoie les dates pour le jeu spécifié")
      .addField("**/s me**", "> liste des parties où le joueur est inscrit")
      .addField("**/s <Partie>**", "> envoie les détails de partie")
      .addField("**/s p <Partie>**", "> participer à une partie (mise en attente auto si pleine)")
      .addField("**/s quit <Partie> (\"<Raison>\")**", "> Quitter une partie")
      .addField("**/s count**", "> nombre de parties sur le serveur")
      .addField("**/s dec <Partie> <JJ/MM> <HH:MM> (\"<Raison>\")**", "> déplace une partie dans le temps **MJ/MOD/ADMIN EXCLUSIF**")
      .addField("**/s rm <Partie> (\"<Raison>\")**", "> annule une partie  **MJ/MOD/ADMIN EXCLUSIF**")
      .addField("**/s mod <Partie> <Variable> ; <Nouvelle valeur> (\"<Raison>\")**", "> modifie une valeur (MJ, Synopsis, Style, Jeu) **MJ/MOD/ADMIN EXCLUSIF**")
      .addField("**/s kick <Partie> <Joueur> (\"<Raison>\")**", "> Supprime un joueur d'une partie **MJ/MOD/ADMIN EXCLUSIF**")
      .addField("**/s ping <Partie> \"<Message>\"**", "> envoie <Message> aux joueurs de la partie **MJ/MOD/ADMIN EXCLUSIF**")
      .addField("**/s assign <Salon>**", "> assigne un salon pour l'envoi des messages automatiques **ADMIN EXCLUSIF**")
      .addField("**/s init**", "> initialise ou réinitialise le bot (supprime les partie et le salon assigné) **ADMIN EXCLUSIF**")
    message.channel.send(format);
  }
  
  if (command.toUpperCase() == ("COUNT")) {
    let p = client.sD[message.guild.id]["Parties"]
    message.channel.send("Il y a " + p.List.length + " partie(s) non-expirée(s) sur le serveur.")
  }
  
  function gameDetails(com) {
    let p = client.sD[message.guild.id]["Parties"][com];

    let format = new Discord.MessageEmbed()
      .setColor("#ffff00")
      .setTitle(com)
      .addField("Jeu", p.specs.Jeu, true)
      .addField("Style", p.specs.Style, true)
      .addField("Date", "le " + p.Date + " à " + p.specs.Heure, true)
      .addField("MJ", p.specs.MJ, true)
      .addField("Synopsis", p.specs.Synopsis, false)
      .addField("Joueurs", p.specs.Joueurs.length < 1 ? "*Aucun joueur par ici...*" : p.specs.Joueurs.join(", "), true)
      .addField("Attente", p.specs.Attente.length < 1 ? "*Aucun joueur par ici...*" : p.specs.Attente.join(", "), true)      
      .addField("Places occupées", p.specs.Joueurs.length + "/" + p.specs.Places, false)

    return (format)
  }
  
  async function sendAssigned(message, p, edit) {
    let cache;
    let assigned = client.channels.cache.get(client.sD[message.guild.id]["assigned"])
    
    if(client.sD[message.guild.id]["assigned"]) {
      if(edit) {
        client.channels.cache.get(client.sD[message.guild.id]["assigned"]).messages.fetch(client.sD[message.guild.id]["Parties"][p]["state"])
          .then(messagea => {messagea.edit(gameDetails(p));})
          .catch(err => console.warn(err))
      } else {
        cache = await assigned.send(gameDetails(p))
        client.sD[message.guild.id]["Parties"][p]["state"] = cache.id;
      }
    }
  }
  
  function sortDates(date) {
    let p = client.sD[message.guild.id]["Parties"]
    let index = 0;
    if (p.List.length > 0) {
      for (var i = 0; i < p.List.length; i++) {
        if (datify(p[p.List[i]].Date, p[p.List[i]].specs.Heure).getTime() <= date.getTime())
          index++;
      }
    }
    return index;
  }
  
  function testForExist(com) {
    if (!client.sD[message.guild.id]["Parties"][com]) {message.channel.send("Cette partie n'existe pas."); return false} 
    else {return true}
  }
}