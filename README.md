# Scheduler

# préfix du bot: /s

/s <JJ/MM> add <Partie> specs <Jeu>;<Style>;<HH:MM>;<Meneur>;"<Synopsis>";<Places>
> ajout de partie

/s <JJ/MM> next <Partie>;<HH:MM>;"<NouveauSynopsis>"
> prévoit une suite de partie et envoie un message aux joueurs ayant participé à la partie avec message pré-définis 
> Hey la suite de ton aventure t'attends : Fais "/s <Partie> confirm" pour confirmer ta présence !

/s 
> /s: envoie la liste des parties à partir de la date d'envoi du message
> /s <JJ/MM> (ex): envoie la liste des parties à partir de la date spécifiée, si "ex" alors uniquement du jour spécifié
> /s <Meneur>: envoie les dates pour le meneur spécifié
> /s me: liste des parties où le joueur est inscrit en temps que <Joueur>
FORMAT:
<JJ/MM> <HH:MM>: Partie:<Partie> Jeu:<Jeu> Style:<Style> MJ:<Meneur> --- <Place Libres>/<Places>
<JJ/MM> <HH:MM>: Partie:<Partie> Jeu:<Jeu> Style:<Style> MJ:<Meneur> --- <Place Libres>/<Places>

/s <Partie>
> envoie les détails de partie
> FORMAT:
> Partie:<Partie>
> Jeu: <Jeu>
> Style: <Style>
> Meneur: <Meneur>
> Synopsis: <Synopsis>
> Joueurs:
> <Joueur1>
> <Joueur2>
> <Joueur3>
> Places: <Libres>/<Total>
> Attente: <NbEnAttente>

/s p <Partie>
> participer à une partie (mise en attente auto si pleine)
> si place se libère, envoie un message au premier de la liste d'attente
> FORMAT:
> Hey!
> Une place s'est libérée et tu as été ajouté à la partie!
> <JJ/MM> <HH:MM>: Partie:<Partie> Jeu:<Jeu> Style:<Style> MJ:<Meneur>

/s quit <Partie> ("<Raison>")
> Quitter une partie + dm au Mj (+Raison)


# MJ+ADMIN/MOD EXCLUSIF:
/s dec <Partie> <JJ/MM> <HH:MM> ("<Raison>")
> déplace une partie dans le temps + ping les joueurs que partie déplacée (+Raison si spécifié)

/s mod <Partie> <Variable> <Nouvelle valeur>
> modifie une donnée d'une partie + ping les joueurs que données modifiées

/s rm <Partie> ("<Raison>")
> annule une partie + ping les joueurs que partie annulée(+Raison si spécifié)
> une fois date dépassée, MJ a 48h pour programmer une suite si il le souhaite

/s kick <Partie> <Joueur> "<Raison>"
> Supprime un joueur d'une partie + ping le joueurs que kick +Raison

/s ping <Partie> "<Message>"
> envoie <Message> aux joueurs de la partie


# JOUEUR DEJA PARTICIPANT DES VOLETS PRECEDENTS EXCLUSIF:
/s confirm <Partie>
> confirme la présence à la suite de la partie

/s abs <Partie>
> ping le mj que le joueur sera absent pour cette partie, mais peut-être pas pour les suivantes

/s stop <Partie>
> ping le MJ que le joueur stoppe la série de parties
