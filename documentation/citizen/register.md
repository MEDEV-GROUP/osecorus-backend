### Documentation de l'API : Inscription d'un Citoyen

---

#### **Endpoint** : `POST /citizen/register`

Cette route permet à un citoyen de s'inscrire en fournissant uniquement son nom complet et son numéro de téléphone. Le mot de passe par défaut est configuré à `1234`. L'utilisateur est initialement inactif (`is_active: false`).

---

### **Requête**

#### **Headers**

Aucun header spécifique requis.

#### **Body Parameters**

| Champ           | Type   | Requis | Description                                                  |
| --------------- | ------ | ------ | ------------------------------------------------------------ |
| `fullName`    | string | Oui    | Nom complet de l'utilisateur (exemple :`Fulgence Medi G`). |
| `phoneNumber` | string | Oui    | Numéro de téléphone unique de l'utilisateur.              |

---

### **Réponses**

#### **Cas de succès**

##### **Code : 201 Created**

```json
{
  "status": "success",
  "message": "Utilisateur enregistré avec succès",
  "data": {
    "id": "e7634f29-1234-5678-9101-112131415161",
    "firstName": "Fulgence",
    "lastName": "Medi G",
    "phoneNumber": "0123456789",
    "role": "CITIZEN",
    "isActive": false
  }
}
```

#### **Cas d'erreur**

##### **Code : 400 Bad Request**

| **Message**                                                  | **Description**                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `"Champs requis manquants"`                                      | Les champs `fullName`ou `phoneNumber`ne sont pas inclus dans la requête.               |
| `"Veuillez fournir votre nom complet (ex : 'Fulgence Medi G')."` | Le champ `fullName`contient moins de deux mots.                                           |
| `"Ce numéro de téléphone est déjà utilisé"`                | Un utilisateur avec le même numéro de téléphone existe déjà dans la base de données. |

##### **Code : 500 Internal Server Error**

```json
{
  "status": "error",
  "message": "Erreur lors de l'inscription",
  "data": "Détails techniques de l'erreur"
}
```

---

### **Exemples**

#### **Inscription réussie**

**Requête**

```json
{
  "fullName": "Fulgence Medi G",
  "phoneNumber": "0123456789"
}
```

**Réponse**

```json
{
  "status": "success",
  "message": "Utilisateur enregistré avec succès",
  "data": {
    "id": "e7634f29-1234-5678-9101-112131415161",
    "firstName": "Fulgence",
    "lastName": "Medi G",
    "phoneNumber": "0123456789",
    "role": "CITIZEN",
    "isActive": false
  }
}
```

---

#### **Erreur : Nom incomplet**

**Requête**

```json
{
  "fullName": "Fulgence",
  "phoneNumber": "0123456789"
}
```

**Réponse**

```json
{
  "status": "error",
  "message": "Veuillez fournir votre nom complet (ex : 'Fulgence Medi G').",
  "data": null
}
```

---

#### **Erreur : Numéro déjà utilisé**

**Requête**

```json
{
  "fullName": "Fulgence Medi G",
  "phoneNumber": "0123456789"
}
```

**Réponse**

```json
{
  "status": "error",
  "message": "Ce numéro de téléphone est déjà utilisé",
  "data": null
}
```
