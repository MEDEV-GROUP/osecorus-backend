### **Documentation de la route : POST `/admin/publish-message`**

---

### **Endpoint :**

`POST /admin/publish-message`

---

### **Type de donnée :**

* **Requête** : `application/json`
* **Authentification** : Token JWT requis dans les  **headers** .

---

### **Données à envoyer :**

#### **Headers :**

| **Champ**   | **Description**                                   | **Obligatoire** |
| ----------------- | ------------------------------------------------------- | --------------------- |
| `Authorization` | Token JWT au format `Bearer <token>`(administrateur). | Oui                   |

#### **Body :**

| **Champ** | **Type** | **Description**             | **Obligatoire** |
| --------------- | -------------- | --------------------------------- | --------------------- |
| `title`       | `string`     | Le titre du message à publier.   | Oui                   |
| `content`     | `string`     | Le contenu détaillé du message. | Oui                   |

---

**Exemple de requête :**

```http
POST /admin/publish-message HTTP/1.1
Host: http://46.202.170.228:3000
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Maintenance du système",
  "content": "Une maintenance est prévue ce dimanche à 2h du matin."
}
```

---

### **Formes de réponses :**

#### **1. Succès (HTTP 201)**

Le message a été publié avec succès.

| **Champ** | **Type** | **Description**                  |
| --------------- | -------------- | -------------------------------------- |
| `id`          | `string`     | Identifiant unique du message publié. |
| `title`       | `string`     | Titre du message publié.              |
| `content`     | `string`     | Contenu détaillé du message publié. |
| `created_at`  | `string`     | Date et heure de création du message. |

**Exemple de réponse :**

```json
{
  "message": "Message publié avec succès",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Maintenance du système",
    "content": "Une maintenance est prévue ce dimanche à 2h du matin.",
    "created_at": "2024-12-16T12:00:00Z"
  }
}
```

---

#### **2. Erreur : Non autorisé (HTTP 401)**

L'utilisateur n'est pas authentifié ou n'a pas le rôle `ADMIN`.

**Exemple de réponse :**

```json
{
  "message": "Accès interdit : seuls les administrateurs peuvent publier un message",
  "data": null
}
```

---

#### **3. Erreur : Champs requis manquants (HTTP 400)**

Si les champs `title` ou `content` sont manquants dans le corps de la requête.

**Exemple de réponse :**

```json
{
  "message": "Champs requis manquants",
  "data": {
    "missingFields": ["title", "content"]
  }
}
```

---

#### **4. Erreur : Serveur (HTTP 500)**

Si une erreur interne survient lors de la publication du message.

**Exemple de réponse :**

```json
{
  "message": "Erreur lors de la publication du message",
  "data": {
    "error": "Détails de l'erreur technique."
  }
}
```

---

### **Résumé des Statuts HTTP :**

| **Statut** | **Condition**                                 | **Message**                                                            |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| 201              | Le message a été publié avec succès             | `"Message publié avec succès"`                                           |
| 401              | Utilisateur non authentifié ou rôle non autorisé | `"Accès interdit : seuls les administrateurs peuvent publier un message"` |
| 400              | Champs manquants dans la requête                   | `"Champs requis manquants"`                                                |
| 500              | Problème interne côté serveur                    | `"Erreur lors de la publication du message"`                               |

---

### **Fonctionnalités :**

1. **Authentification :** Utilise le middleware `authenticate()` pour vérifier le token JWT et s'assurer que l'utilisateur est authentifié.
2. **Vérification du rôle :** Seuls les utilisateurs avec le rôle `ADMIN` sont autorisés à utiliser cette route.
3. **Validation des données :** Vérification des champs `title` et `content` dans le corps de la requête.
4. **Log des événements :** Chaque étape (succès, échec) est loguée avec des informations comme l'IP, le device, et l'action.

---
