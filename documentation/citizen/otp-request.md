### Documentation de l'API : Gestion des OTP pour les Citoyens

---

#### **Endpoint** : `POST /otp`

Cette route permet de créer ou de régénérer un OTP (One-Time Password) pour un citoyen identifié par son numéro de téléphone. 

---

### **Requête**

#### **Headers**
Aucun header spécifique requis.

#### **Body Parameters**
| Champ          | Type   | Requis | Description                                                                 |
|-----------------|--------|--------|-----------------------------------------------------------------------------|
| `type`         | string | Oui    | Type d'opération : `'create'` pour créer un nouvel OTP, `'resend'` pour régénérer. |
| `phoneNumber`  | string | Oui    | Numéro de téléphone du citoyen pour lequel l'OTP doit être généré ou régénéré. |

---

### **Réponses**

#### **Cas de succès**
##### **Code : 201 Created** (OTP créé avec succès)
```json
{
  "status": "success",
  "message": "OTP créé avec succès",
  "data": {
    "phoneNumber": "0123456789",
    "otp": "12345",
    "expiresAt": "2024-11-28T13:45:00.000Z"
  }
}
```

##### **Code : 200 OK** (OTP régénéré avec succès)
```json
{
  "status": "success",
  "message": "OTP régénéré avec succès",
  "data": {
    "phoneNumber": "0123456789",
    "otp": "67890",
    "expiresAt": "2024-11-28T13:50:00.000Z"
  }
}
```

#### **Cas d'erreur**
##### **Code : 400 Bad Request**
| **Message**                                                  | **Description**                                                                                              |
|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `"Champs requis manquants"`                                  | Les champs `type` ou `phoneNumber` ne sont pas inclus dans la requête.                                       |
| `"Numéro de téléphone introuvable ou non associé à un Citoyen"` | Le numéro fourni n'existe pas dans la base de données ou n'est pas associé à un utilisateur de type `CITIZEN`. |
| `"Un OTP existe déjà pour ce numéro. Utilisez le type 'resend' pour régénérer."` | Une tentative de création a été effectuée pour un OTP existant.                                              |
| `"Aucun OTP n'existe pour ce numéro. Utilisez le type 'create' pour en générer un."` | Une tentative de régénération a été effectuée pour un OTP inexistant.                                        |
| `"Type d'opération invalide. Utilisez 'create' ou 'resend'."` | La valeur de `type` n'est pas valide.                                                                        |

##### **Code : 500 Internal Server Error**
```json
{
  "status": "error",
  "message": "Erreur serveur lors de la gestion de l'OTP",
  "data": "Détails techniques de l'erreur"
}
```

---

### **Exemples**

#### **Création d'un OTP**
**Requête**
```json
{
  "type": "create",
  "phoneNumber": "0123456789"
}
```

**Réponse**
```json
{
  "status": "success",
  "message": "OTP créé avec succès",
  "data": {
    "phoneNumber": "0123456789",
    "otp": "12345",
    "expiresAt": "2024-11-28T13:45:00.000Z"
  }
}
```

---

#### **Régénération d'un OTP**
**Requête**
```json
{
  "type": "resend",
  "phoneNumber": "0123456789"
}
```

**Réponse**
```json
{
  "status": "success",
  "message": "OTP régénéré avec succès",
  "data": {
    "phoneNumber": "0123456789",
    "otp": "67890",
    "expiresAt": "2024-11-28T13:50:00.000Z"
  }
}
```

---

#### **Erreurs fréquentes**
**Requête**
```json
{
  "type": "resend",
  "phoneNumber": "9876543210"
}
```

**Réponse**
```json
{
  "status": "error",
  "message": "Aucun OTP n'existe pour ce numéro. Utilisez le type 'create' pour en générer un.",
  "data": null
}
```