Voici la documentation de la route pour vérifier l'OTP, activer l'utilisateur et générer un token :

---

### **Vérification de l'OTP**

**URL** : `/verify-otp`

**Méthode** : `POST`

**Description** : Cette route permet de vérifier un OTP associé à un numéro de téléphone. Si l'OTP est valide, elle active l'utilisateur en définissant le champ `is_active` à `true`, génère un token JWT et retourne les informations de l'utilisateur ainsi que le token.

---

#### **Champs requis**

| Champ       | Type   | Obligatoire | Description                                    |
| ----------- | ------ | ----------- | ---------------------------------------------- |
| phoneNumber | String | Oui         | Le numéro de téléphone de l'utilisateur.    |
| otp         | String | Oui         | Le code OTP envoyé au numéro de téléphone. |

---

#### **Réponses**

##### **Succès : 200**

```json
{
  "message": "OTP vérifié avec succès",
  "data": {
    "user": {
      "id": "d65a2f0c-bb6d-453c-a88e-1c87f84245ec",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "0123456789",
      "role": "CITIZEN",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

| Champ       | Type   | Description                                                                                          |
| ----------- | ------ | ---------------------------------------------------------------------------------------------------- |
| user        | Object | Informations de l'utilisateur activé.                                                               |
| id          | String | Identifiant unique de l'utilisateur.                                                                 |
| firstName   | String | Prénom de l'utilisateur.                                                                            |
| lastName    | String | Nom de l'utilisateur.                                                                                |
| phoneNumber | String | Numéro de téléphone de l'utilisateur.                                                             |
| role        | String | Rôle de l'utilisateur (`CITIZEN`).                                                                |
| isActive    | Bool   | Indique si l'utilisateur est activé (`true`).                                                     |
| token       | String | Token JWT généré pour l'utilisateur. Utilisez ce token pour l'authentification des requêtes API. |

---

##### **Erreurs**

###### **Champs manquants : 400**

```json
{
  "message": "Champs requis manquants",
  "data": {
    "missingFields": ["phoneNumber", "otp"]
  }
}
```

###### **Numéro de téléphone introuvable : 400**

```json
{
  "message": "Numéro de téléphone introuvable ou non associé à un Citizen",
  "data": null
}
```

###### **OTP introuvable : 400**

```json
{
  "message": "Aucun OTP trouvé pour ce numéro",
  "data": null
}
```

###### **OTP invalide : 400**

```json
{
  "message": "Code OTP invalide",
  "data": null
}
```

###### **OTP expiré : 400**

```json
{
  "message": "Code OTP expiré",
  "data": null
}
```

###### **Erreur serveur : 500**

```json
{
  "message": "Erreur serveur lors de la vérification de l'OTP",
  "data": "Détails de l'erreur"
}
```

---

#### **Exemple de requête**

**URL** : `/verify-otp`

**Méthode** : `POST`

**Corps de la requête** :

```json
{
  "phoneNumber": "0123456789",
  "otp": "12345"
}
```

---

#### **Remarques**

* L'OTP a une durée de validité de 5 minutes. Passé ce délai, il est considéré comme expiré.
* Une fois l'OTP validé, il est supprimé de la base de données pour éviter toute réutilisation.
